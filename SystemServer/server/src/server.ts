import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import http from "http";
import logger from "morgan";
import { apiRouter } from "./router";

export class Server {
    public app: express.Express;
    private server: http.Server;

    constructor() {
        this.app = express();
        this.app.use(bodyParser.json());

        if (process.env.NODE_ENV === "development") {
            this.setDevelopmentEnvironment();
        }

        this.route();
    }

    public start(port = process.env.PORT || 3000) {
        this.close();
        this.server = this.app.listen(port, () =>
            console.log(`Express listen on http://localhost:${port}`),
        );
    }

    public close() {
        if (this.server) {
            this.server.close(() => {
                this.server = null;
                console.log("Express is closed");
            });
        }
    }

    private setDevelopmentEnvironment() {
        this.app.use(logger("dev"));
        this.app.use(cors());
    }

    private route() {
        this.app.use(express.static("public"));
        this.app.use("/api", apiRouter);
    }
}
