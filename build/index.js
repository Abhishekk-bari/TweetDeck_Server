"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app"); // Importing the initServer function from the app module
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield (0, app_1.initServer)(); // Calling initServer and waiting for it to initialize the Express app
        app.listen(8000, () => console.log('Server Started at PORT:8000')); // Starting the server to listen on port 8000 and logging a message to the console
    });
}
init(); // Calling the init function to execute the server initialization and start process
