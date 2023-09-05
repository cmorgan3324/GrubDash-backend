const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// GET /dishes
function list(req,res) {
    res.json({ data: dishes });
}

// Validation for missing/empty properties
function dishDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName] && data[propertyName] !== "") {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}.`
        });
    };
}

// Validation for appropriate price value
function priceIsValidNumber(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: "price"
        })
    }
    next();
}

// POST /dishes
function create(req,res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
//     let lastDishId = dishes.reduce((maxId, dish) => Math.max(maxId, dish.id), 0);
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

// Validation of specfic /:dishId exists
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    } else {
        next({
            status: 404,
            message: `Dish does not exist : ${dishId}`,
        })
    }
}
// Validation to match route param id w/ data id
function dishIdMatchesDataId(req, res, next) {
    const { data: {id} = {} } = req.body;
    const { dishId } = req.params;
    if (id !== "" && id !== dishId && id !== null && id !== undefined){
        next({
            status: 400,
            message: `Dish id does not match route id. Dish ${id}, Route:${dishId}`,
        })
    }
    next();
}

// GET /dishes/:dishId
function read(req, res) {
    res.json({ data: res.locals.dish });
}

// PUT /dishes/:dishId
function update(req, res) {
    const { dishId } = req.params
    const dish = res.locals.dish;

//     const dishMatch = dishes.find((dish) => dish.id === dishId);
    const { data: { name, description, price, image_url } = {} } = req.body;

    // Update dish properties
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish })
}

module.exports = {
    list,
    create: [
        dishDataHas("name"),
        dishDataHas("description"),
        dishDataHas("price"),
        dishDataHas("image_url"),
        priceIsValidNumber,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
          dishIdMatchesDataId,
        dishDataHas("name"),
        dishDataHas("description"),
        dishDataHas("price"),
        dishDataHas("image_url"),
        priceIsValidNumber,
        update
    ],
};