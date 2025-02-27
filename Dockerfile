FROM node:21.6.2-slim

RUN mkdir /opt/informxr
RUN cd /opt/informxr
WORKDIR /opt/informxr

RUN apt-get -y update
RUN apt-get -y install nano
RUN apt-get -y install apt-utils
RUN apt-get -y install npm

# Command to run the application.
# ENTRYPOINT [ "./ixr-buildall.sh" ]
RUN npm run build
RUN npx webpack
