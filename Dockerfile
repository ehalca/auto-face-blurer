FROM ubuntu:20.04
WORKDIR /app
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update
# # face detect
# RUN apt-get install python3 python3-opencv libopencv-dev -y
# COPY ./facedetect /usr/local/bin


# # alpr
RUN apt install -y libtesseract-dev git cmake build-essential libleptonica-dev liblog4cplus-dev libcurl3-dev
RUN git clone https://github.com/openalpr/openalpr.git
RUN cd openalpr/src && mkdir build && cd build && cmake -DCMAKE_INSTALL_PREFIX:PATH=/usr -DCMAKE_INSTALL_SYSCONFDIR:PATH=/etc .. && make && make install

# node
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs
RUN npm install --global yarn

# COPY . .

RUN yarn install
RUN yarn serve

EXPOSE 4201
EXPOSE 4200
EXPOSE 3000
EXPOSE 9229
#facedetect ./tests/images.jpg --data-dir /usr/share/opencv4
#alpr -c eu -j ./tests/car.jpg 