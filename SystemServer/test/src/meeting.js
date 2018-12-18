const expect = require('chai').expect;
const supertest = require('supertest');
const MS = {
    SEC: 1000,
    MIN: 1000 * 60,
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24
}


let createdMeetingId;

module.exports = function (environment) {
    const request = supertest(environment.api);
    describe('Meeting', () => {
        describe('[POST] /meeting', () => {
            it('should be able to create', (done) => {
                request.post("/meeting")
                    .set({
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${environment.token}`
                    })
                    .send({
                        title: "Testing meeting",
                        description: "this is the description",
                        location: "Tsing Yi",
                        language: "en-US",
                        priority: 1,
                        length: MS.MIN * 30,
                        type: "group_discussion"
                    })
                    .expect(200)
                    .end((err, res) => {
                        if (err) done(err);
                        else {
                            expect(res.body).to.have.property("id");
                            createdMeetingId = res.body.id;
                            done();
                        }
                    })
            });

        });
        describe('[GET] /meeting', () => {
            it('should be able to get draft just created', (done) => {
                request.get("/meeting?resultPageNum=1&resultPageSize=1&status=draft&hostedByMe=true&hostedByOther=true")
                    .set({
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${environment.token}`
                    })
                    .expect(200)
                    .end((err, res) => {
                        if (err) done(err);
                        else {
                            expect(res.body.length).to.equal(1);
                            expect(res.body).to.have.property("items");
                            expect(res.body.items).to.have.length(1);
                            done(err);
                        }
                    })
            });
        });
        describe('[GET] /meeting/:id', () => {

                it('should be able to get draft by id', (done) => {
                    request.get(`/meeting/${createdMeetingId}`)
                        .set({
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${environment.token}`
                        })
                        .expect(200)
                        .end((err, res) => {
                            if (err) done(err);
                            else {
                                expect(res.body.length).to.equal(1);
                                expect(res.body).to.have.property("items");
                                expect(res.body.items).to.have.length(1);
                                done(err);
                            }
                        })
                });

                it('should return empty items if the meeting is not exist when getting by id', (done) => {
                    request.get(`/meeting/a688e36f-44a4-4009-9df5-8647cf4fec5b;d2251933-a0f0-4fc1-ada7-4aa12bc3c96f`)
                        .set({
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${environment.token}`
                        })
                        .expect(200)
                        .end((err, res) => {
                            if (err) done(err);
                            else {
                                expect(res.body.length).to.equal(0);
                                expect(res.body).to.have.property("items");
                                expect(res.body.items).to.have.length(0);
                                done(err);
                            }
                        })
                });
            }
        );
        describe('[PUT] /meeting/:id', () => {
            it('should be able to edit (Basic)', (done) => {
                request.put(`/meeting/${createdMeetingId}`)
                    .set({
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${environment.token}`
                    })
                    .send({
                        title: "Testing meeting (Edited)",
                        description: "edited description",
                        location: "Hong Kong Somewhere",
                        language: "en-US",
                        priority: 2,
                        length: MS.MIN * 60,
                        type: "group_discussion"
                    })
                    .expect(200)
                    .end((err, res) => {
                        if (err) done(err);
                        else {
                            expect(res.body).to.have.property("id");
                            createdMeetingId = res.body.id;
                            done();
                        }
                    })
            });
        });

        describe('[PUT] /meeting/:id/participant', () => {
            it('should be able to edit participants', (done) => {
                request.put(`/meeting/${createdMeetingId}/participant`)
                    .set({
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${environment.token}`
                    })
                    .send({
                        friends: [],
                        email: ['thisisaemail123123aa@gmail.com', 'thisisanotheremail12312546756@gmail.com'],
                    })
                    .expect(200)
                    .end((err, res) => {
                        done(err)
                    });
            });
        });
    });
};
