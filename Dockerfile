FROM node:21.6.2-slim

# Expose the port the app runs on
EXPOSE 3000

RUN mkdir /opt/informxr
WORKDIR /opt/informxr
# copy setup files
COPY .eslintignore .eslintrc.json .prettierrc.js package.json package-lock.json tsconfig.json LICENSE README.md ./

# copy application files
COPY src/ ./src/
COPY shell/ ./shell/
RUN chmod +x ./shell/packagelib.sh
COPY samples/ ./samples/

#RUN npm install --legacy-peer-deps
RUN npm install

COPY docker-ixr-launch.sh /usr/local/bin/ixr-launch.sh
RUN chmod +x /usr/local/bin/ixr-launch.sh

# build the app
RUN npm run build

# Command to run the application
ENTRYPOINT [ "/usr/local/bin/ixr-launch.sh" ]