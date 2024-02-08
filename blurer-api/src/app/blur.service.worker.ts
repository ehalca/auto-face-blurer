import { parentPort, workerData } from 'worker_threads';
import { join, resolve } from 'path';
import { exec } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs';
import { getApiPath, getBatch } from './app.service';

const { batchFolder } = workerData;
async function worker() {
  // parentPort.postMessage({ status: 'done', batchFolder });
  const batch = getBatch(batchFolder);
  const inputs = readdirSync(batch.inputFolder);
  if (!existsSync(batch.outputFolder)) {
    mkdirSync(batch.outputFolder, { recursive: true });
  }
  for (const input of inputs) {
    parentPort.postMessage({ status: 'wip', batchFolder, input:getApiPath(batch.folder, true, input) });
    const fileName = input.split('/').pop();
    const output = join(batch.outputFolder, `out_${fileName}`);
    if (existsSync(output)) {
      continue;
    }
    console.log('Blurring', input);
    const coordinates = await getCoordinates(join(batch.inputFolder, input));
    if (coordinates.length > 0) {
      const workingFile = join(batch.batchFolder, input);
      copyFileSync(join(batch.inputFolder, input), workingFile);
      await blur(workingFile, coordinates);
      copyFileSync(workingFile, output);
      rmSync(workingFile);
    }else{
      copyFileSync(join(batch.inputFolder, input), output);
    }
    parentPort.postMessage({ status: 'blurred', batchFolder, input: getApiPath(batch.folder, true, input), output : getApiPath(batch.folder, false, `out_${fileName}`) });
  }
  parentPort.postMessage({ status: 'done', batchFolder });
  
}

async function blur(input:string, coordinates:number[][]){
  for (const [x, y, w, h] of coordinates) {
    await new Promise((resolve, reject) => {
      exec(
        `mogrify -gravity NorthWest -region "${w}x${h}+${x}+${y}" \
  -scale '5%' -scale '2000%' -blur 2x2.5 "${input}"`,
        (error, stdout, stderr) => {
          resolve(null);
        }
      );
    })
  }
}

async function getCoordinates(input: string){
  const coordinatesPromises = await Promise.allSettled([
    new Promise((resolve, reject) => {
      exec(
        `facedetect "${input}" --data-dir /usr/share/opencv4`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`error: ${error.message}`);
            reject(error);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            reject(stderr);
            return;
          }
          const coordinates = stdout
            .split('\n')
            .slice(0, -1)
            .map((l) =>
              l
                .trim()
                .split(' ')
                .map((c) => parseInt(c))
            );
          resolve(coordinates);
        }
      );
    }),
    new Promise((resolve, reject) => {
      exec(`alpr -c eu -j "${input}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject(stderr);
          return;
        }
        const data = JSON.parse(stdout);
        const results = data.results.map(r=>{
          const x = r.coordinates.reduce((r,e)=>Math.min(r,e.x), r.coordinates[0].x);
          const y = r.coordinates.reduce((r,e)=>Math.min(r,e.y), r.coordinates[0].y);
          const w = r.coordinates.reduce((r,e)=>Math.max(r,e.x), r.coordinates[0].x);
          const h = r.coordinates.reduce((r,e)=>Math.max(r,e.y), r.coordinates[0].y);
          return [x,y,w-x,h-y];
        });
        resolve(results);
      })
    })
  ]);
  const coordinates = coordinatesPromises
    .filter((p) => p.status === 'fulfilled')
    .map((p) => (p as any).value)
    .flat();
  return coordinates;
}

worker();
