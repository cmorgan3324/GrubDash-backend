const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// GET /orders
function list(req,res) {
    res.json({ data: orders });
}

//  Create Validation
const validateProperties = (req, res, next) => {
    const { data } = req.body;
    const requiredProps = ['deliverTo', 'mobileNumber', 'dishes'];
  
    requiredProps.forEach(prop => {
      if (!data[prop]) {
        next({
            status: 400,
            message: `Order must include a ${prop}`
        });
      }
      if (prop === 'dishes') {
  
        if (data[prop].length === 0 || !Array.isArray(data[prop])) {
            next({
                status: 400,
                message: 'Order must include at least one dish'
            });
        }
  
        data[prop].forEach((dish, index) => {
          if (!dish['quantity'] || !Number.isInteger(dish['quantity']) || dish['quantity'] <= 0) {
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
          }
        })
      }
    })
    return next();
  }


// POST /orders
function create(req,res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

// Validation of specfic /:orderId exists
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    } else {
        next({
            status: 404,
            message: `Order does not exist : ${orderId}`,
        })
    }
}

// Validaton to match route param id w/ data id
function orderIdMatchesDataId(req, res, next) {
const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const { orderId } = req.params;
    if (!req.body.data.id || req.body.data.id === "") {
      return next();
    }
    if (req.body.data.id != res.locals.order.id) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
      })
    }
    else {
      return next();
    }
}

// Validation of status property
function statusPropertyIsValid(req, res, next) {
const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    if (!status || status === "" || status === "invalid") {
      return next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
    }
    else if (status === "delivered") {
      next({
        status: 400,
        message: "A delivered order cannot be changed",
      })
    }
    else {
      return next();
    }
}

// Validation of delivered order status
function deliveredStatus(res, req, next) {
    const { data: { status } = {} } = req.body;
    if (status === "Delivered"){
        return next({
            status: 404,
            message: "A delivered order cannot be changed."
        })
    }
    next();
}

// GET /orders/:orderId
function read(req, res) {
    res.json({ data: res.locals.order });
}

// PUT /orders/:orderId
function update(req, res) {
    const { orderId } = req.params
    const order = res.locals.order;

    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    // Update order properties
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order })
}

// Validation for order deleting while pending status
function deletePendingOrder(req, res, next) {
        const { status } = res.locals.order;
    if (status !== "pending"){
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending."
        });
    }
    next();
}

// DELETE /orders/:orderId
function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
  }

  module.exports = {
    list,
    create: [ validateProperties, create ],
    read: [ orderExists, read ],
    update: [
        orderExists,
        validateProperties,
        orderIdMatchesDataId,
        statusPropertyIsValid,
        update
    ],
    delete: [
        orderExists,
        deletePendingOrder,
        destroy
    ],
  }