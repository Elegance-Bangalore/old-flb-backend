const idNotFoundError = (res, id) => {
    if (!id) {
        return res.status(400).send({ error: "ID not found" });
    } else {
        return res.status(400).send({ error: "Developer not found" });
    }
};

const validateFields = (res) => {
    return res.status(400).send({ error: "This field is required" });
};
const validateFound = (res) => {
    return res.status(400).send({ error: "not found" });
};
const validateId = (res) => {
    return res.status(400).send({ error: "Id is required" });
};

module.exports = {
    idNotFoundError, validateFields, validateFound, validateId
};
