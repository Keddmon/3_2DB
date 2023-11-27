var express = require('express');
var router = express.Router();
const indexCtrl = require('../controller/controller.js');

/* main page */
router.get('/', indexCtrl.main);


router.get('/bestMenu', indexCtrl.bestMenu);

/* menu page */
router.get('/menu', indexCtrl.menu);

/* menu details page */
router.get('/menu/:menu_id', indexCtrl.menuDetail);

/* user register page */
router.get('/register', function(req, res) {
    res.render('register', { message: ''});
});
router.post('/register', indexCtrl.userRegister);

/* user login page */
router.get('/login', function(req, res) {
    res.render('login', { message: ""});
});
router.post('/login', indexCtrl.userLogin);

/* user logout */
router.get('/logout', indexCtrl.userLogout);

/* cart page */
router.get('/cart', indexCtrl.getCart);
router.post('/cart', indexCtrl.insertCart);
router.post('/cart/:menu_id', indexCtrl.updateCart);
router.post('/delete_item/:menu_id', indexCtrl.deleteCart);

/* checkout page */
router.get('/checkout', indexCtrl.checkout);
router.post('/checkout', indexCtrl.order);

/* order */
router.post('/order', indexCtrl.order);

/* order complete */
router.get('/order_complete', function(req, res) {
    res.render('/order_complete');
});

/* searchMenu */
router.get('/search', indexCtrl.searchMenu);

/* reward status */
router.get('/reward_status', indexCtrl.getRewardStatus);

/* use reward points */
router.post('/useRewardPoints', indexCtrl.useRewardPoints);

/* admin page */
router.get('/admin/users', indexCtrl.viewUsers);
router.get('/admin/orders', indexCtrl.viewOrders);
router.get('/admin/menu_management', indexCtrl.menuManagement);
router.post('/admin/menu/:menu_id/recommend', indexCtrl.setRecommendMenu);
router.post('/admin/menu', indexCtrl.addMenu);
router.post('/admin/menu/:menu_id', indexCtrl.deleteMenu);
router.get('/admin/ingredient_management', indexCtrl.ingredientManagement);
router.post('/admin/ingredient_management', indexCtrl.orderIngredient);


module.exports = router;