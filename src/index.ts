import { initServer } from "./app"; // Importing the initServer function from the app module

async function init() { // Defining an asynchronous function to initialize and start the server
    const app = await initServer(); // Calling initServer and waiting for it to initialize the Express app
    app.listen(8000, () => console.log('Server Started at PORT:8000')); // Starting the server to listen on port 8000 and logging a message to the console
}

init(); // Calling the init function to execute the server initialization and start process