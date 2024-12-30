const routes = require('./routes');
const Hapi = require('@hapi/hapi');

const init = async () => {
    const server = Hapi.server({
        port: 9000,
        host: 'localhost',
        });


    server.route(routes);
    await server.start();
    console.log(`Server running ${server.info.uri}`);
    
};

init();