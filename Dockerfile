FROM node:21.6.2-slim

RUN mkdir /opt/informxr
RUN cd /opt/informxr
COPY package.json ./ 
COPY ixr-buildall.sh ./ 
WORKDIR /opt/informxr

RUN apt-get -y update
RUN apt-get -y install nano
RUN apt-get -y install apt-utils
RUN apt-get -y install npm

RUN npm install

# Command to run the application.
ENTRYPOINT [ "./ixr-buildall.sh" ]
