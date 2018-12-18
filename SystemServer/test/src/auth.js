const expect = require("chai").expect;
const supertest = require("supertest");

let token = null;

module.exports = function(environment, username, password) {
    const request = supertest(environment.api);
    describe("Auth", () => {
        describe("[POST] /auth/register", () => {
            it("should be able to register", done => {
                request
                    .post("/auth/register")
                    .set("Accept", "application/json")
                    .send({
                        username: username,
                        password: password,
                        email: `${username}@gmail.com`,
                    })
                    .expect(200)
                    .end((err, res) => {
                        done(err);
                    });
            });

            it("should not be able to register with same username", done => {
                request
                    .post("/auth/register")
                    .set("Accept", "application/json")
                    .send({
                        username: username,
                        password: password,
                        email: `${username}@gmail.com`,
                    })
                    .expect(400)
                    .end((err, res) => {
                        expect(res.body).to.have.property("message");
                        done(err);
                    });
            });

            it("should not be able to register with same email", done => {
                request
                    .post("/auth/register")
                    .set("Accept", "application/json")
                    .send({
                        username: username,
                        password: password,
                        email: "tester@gmail.com"
                    })
                    .expect(400)
                    .end((err, res) => {
                        expect(res.body).to.have.property("message");
                        done(err);
                    });
            });
        });

        describe("[POST] /auth/login", () => {
            it("should be able to get token with correct password", done => {
                request
                    .post("/auth/login")
                    .set("Accept", "application/json")
                    .send({
                        username: username,
                        password: password,
                    })
                    .expect(200)
                    .end((err, res) => {
                        expect(res.body).to.have.property("token");
                        token = res.body.token;
                        environment.token = token;
                        done(err);
                    });
            });

            it("should not be able to get token with wrong password", done => {
                request
                    .post("/auth/login")
                    .set("Accept", "application/json")
                    .send({
                        username: username,
                        password: "wrongpassword",
                    })
                    .expect(401)
                    .end((err, res) => {
                        done(err);
                    });
            });
        });

        describe("[POST] /auth/logout", () => {
            it("should be able to logout with correct token header", done => {
                request
                    .post("/auth/logout")
                    .set({
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    })
                    .expect(200)
                    .end((err, res) => {
                        done(err);
                    });
            });

            it("should not be able to logout with wrong token header", done => {
                request
                    .post("/auth/logout")
                    .set({
                        Accept: "application/json",
                        Authorization: `Bearer null`,
                    })
                    .expect(401)
                    .end((err, res) => {
                        done(err);
                    });
            });
        });

        describe("[POST] /auth/login", () => {
            it("should be able to login again after logout", done => {
                request
                    .post("/auth/login")
                    .set("Accept", "application/json")
                    .send({
                        username: username,
                        password: password,
                    })
                    .expect(200)
                    .end((err, res) => {
                        expect(res.body).to.have.property("token");
                        token = res.body.token;
                        environment.token = token;
                        done(err);
                    });
            });
        });
    });
};
