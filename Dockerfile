FROM node:21.6.2-slim

# Expose the port the app runs on
# EXPOSE 3000

RUN mkdir /opt/informxr
RUN cd /opt/informxr
WORKDIR /opt/informxr
# copy setup files
# COPY .eslintignore .eslintrc.json .prettierrc.js package.json package-lock.json tsconfig.json LICENSE README.md ./
# COPY .eslintignore .eslintrc.json package.json package-lock.json tsconfig.json LICENSE README.md ./

# copy application files
# COPY src/ ./src/
# COPY shell/ ./shell/
# RUN chmod +x ./shell/packagelib.sh
# COPY samples/ ./samples/

RUN apt-get -y update
RUN apt-get -y install nano
RUN apt-get -y install apt-utils
RUN apt-get -y install npm

# RUN npm install --legacy-peer-deps
# RUN npm install
# RUN npm i -D webpack webpack-cli typescript ts-loader
# RUN npm i buffer crypto-browserify

CMD ["npm", "install", "&&", "npm", "run", "build", "&&", "npx", "webpack"]

RUN echo "Give loyalty to your nation always, to your leaders when they earn it."

# COPY docker-ixr-launch.sh /usr/local/bin/ixr-launch.sh
# RUN chmod +x /usr/local/bin/ixr-launch.sh

# build the app
# RUN npm run build
# RUN npx webpack

# Command to run the application
# ENTRYPOINT [ "/usr/local/bin/ixr-launch.sh" ]

# RUN bash
