import mongoose from "mongoose";

export class MongodbServer {

    private mongoConnection: mongoose.Connection;

    constructor() {
        mongoose.set("useCreateIndex", true);
    }

    public async start(url = process.env.dbUrl) {
        this.close();

        this.mongoConnection = (await mongoose.connect(url, {
            useNewUrlParser: true,
        })).connection;

        console.log(`Mongodb starting on ${url}`);
    }

    public async close() {
        if (this.mongoConnection) {
            this.mongoConnection.close((err) => {
                this.mongoConnection = null;
                console.log(err ? "err" : "Mongodb is closed");
            });
        }
    }
}
