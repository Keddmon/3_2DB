const pool = require('../../DB/db');

// 메인화면
exports.main = async(req, res) =>{
    res.render('main', { user: req.session.user });
}

// 회원보기
exports.user = async(req, res) => {
    try {
        const q1 = 'SELECT * FROM user';

        const result = await pool.query(q1);
        console.log(result[0]);

        res.render("user", {data:result[0]});
    } catch (error) {
        res.render("user");
    }
}

// 메뉴보기
exports.menu = async(req, res) => {
    try {
        const q2 = 'SELECT * FROM menu';

        const result = await pool.query(q2);
        console.log(result[0]);

        res.render("menu", {data:result[0]});
    } catch (error) {
        res.render("menu");
    }
}

// 메뉴상세보기
exports.menuDetail = async(req,res) => {
    try {
        const menu_id = req.params.menu_id;
        const q3 = 'SELECT * FROM menu WHERE menu_id = ?';

        const result = await pool.query(q3, [menu_id]);
        console.log(result[menu_id]);

        res.render("menu_detail", {data:result[0]});
    } catch (error) {
        res.render("menu_detail");
    }
}

// 회원가입
exports.userRegister = async(req, res) => {
    try {
        const { user_id, user_password, user_name, user_address, user_number } = req.body;

        console.log(req.body)
        // 필드 확인
        if (!user_id.trim() || !user_password.trim() || !user_name.trim() || !user_address.trim() || !user_number.trim()) {
            console.log("회원가입 실패: 빈칸을 모두 채워주세요");
            res.redirect('/register', { message: "회원가입 실패: 빈칸을 모두 채워주세요"});
        }

        // 동일 아이디 검사
        const checkQuery = 'SELECT * FROM user WHERE user_id = ?';
        const checkResult = await pool.query(checkQuery, [user_id]);

        if (checkResult[0].length > 0) {
            console.log("회원가입 실패 : 이미 존재하는 아이디");
            res.redirect('/register', { message: "회원가입 실패: 이미 존재하는 아이디" });
        }

        // 필드 입력
        const q4 = 'INSERT INTO user (user_id, user_password, user_name, user_address, user_number) VALUES (?, ?, ?, ?, ?)';
        const result = await pool.query(q4, [user_id, user_password, user_name, user_address, user_number]);
        console.log("회원가입 성공");
        res.render('login', { message: "회원가입 성공" });
        
    } catch (error) {
            console.error("회원가입 실패", error);
            res.redirect('/register', { message: "회원가입 실패" });
    }
}

// 로그인
exports.userLogin = async(req, res) => {
    try {
        const { user_id, user_password } = req.body;
        
        // 입력 확인
        if (!user_id.trim() || !user_password.trim()) {
            console.log("로그인 실패: 미입력 ");
            return res.render('login', { message: "로그인 실패: 미입력"});
        }

        // 일치 확인
        const checkQuery = 'SELECT * FROM user WHERE user_id = ? AND user_password =?';
        const checkResult = await pool.query(checkQuery, [user_id, user_password]);

        if (checkResult[0].length > 0 ) {
            console.log("로그인 성공");
            req.session.user = checkResult[0][0];
            return res.redirect('/');
        } else {
            console.log("로그인 실패: 미일치");
            return res.render('login', { message: "로그인 실패: 미일치"});
        }
    } catch (error) {
        console.error("로그인 실패", error);
        return res.render('login', { message: "로그인 실패"});
    }
}

exports.userLogout = async(req, res) => {
    if(req.session) {
        req.session.destroy(err => {
            if(err) {
                return res.redirect('/error');
            }
            return res.redirect('/');
        });
    }
};

exports.getCart = async(req, res) => {
    try {
        const userId = req.session.user.user_id;

        const cartListQuery = 'SELECT cl.*, m.menu_name, m.menu_price FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const cartList = await pool.query(cartListQuery, [userId]);

        const totalQuery = 'SELECT SUM(m.menu_price * cl.cart_list_quantity) AS total FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?' ;
        const totalResult = await pool.query(totalQuery, [userId]);

        // 테스트
        console.log(totalResult);

        res.render('cart', { cart: cartList[0], total: totalResult[0][0].total });
    } catch (error) {
        console.error("장바구니 보기 실패", error);
        res.redirect('/error');
    }
}

exports.insertCart = async(req,res) => {
    try {
        const userId = req.session.user.user_id;
        const menuId = req.body.menu_id;
        const quantity = parseInt(req.body.quantity);
        const redirect = req.body.redirect;

        // cart_list : 해당 메뉴 존재 여부 확인
        const checkQuery = 'SELECT * FROM cart_list WHERE user_id = ? AND menu_id = ?';
        const checkResult = await pool.query(checkQuery, [userId, menuId]);

        if (checkResult[0].length > 0) {
            // cart_list : 장바구니 담기 (동일 메뉴 시 누적)
            const updateQuery = 'UPDATE cart_list SET cart_list_quantity = cart_list_quantity + ? WHERE user_id = ? AND menu_id = ?';
            await pool.query(updateQuery, [quantity, userId, menuId]);
        } else {
            // cart_list : 장바구니 담기
            const insertQuery = 'INSERT INTO cart_list (user_id, menu_id, cart_list_quantity) VALUES (?, ?, ?)';
            await pool.query(insertQuery, [userId, menuId, quantity]);
        }

        // cart user_id 확인, 없으면 생성
        const cartQuery = 'SELECT * FROM cart WHERE user_id = ?';
        let cart = await pool.query(cartQuery, [userId]);

        if (redirect === 'cart') {
            res.redirect('/cart');
        } else if (redirect === 'menu') {
            res.redirect('/menu');
        } else {
            res.redirect('/error');
        }
    } catch(error) {
        console.error("장바구니 담기 실패", error);
        res.redirect('/error');
    }
};

exports.updateCart = async(req, res) => {
    try {
        const userId = req.session.user.user_id;
        const menuId = req.params.menu_id;
        const quantity = parseInt(req.body['quantity_' + menuId]);

        const updateQuery = 'UPDATE cart_list SET cart_list_quantity = ? WHERE user_id = ? AND menu_id = ?';
        await pool.query(updateQuery, [quantity, userId, menuId]);

        console.log(req.body.quantity);

        res.redirect('/cart');
    } catch (error) {
        console.error("수량 변경 실패", error);
        res.redirect('/error');
    }
};

exports.deleteCart = async(req, res) => {
    try {
        const userId = req.session.user.user_id;
        const menuId = req.params.menu_id;

        const deleteQuery = 'DELETE FROM cart_list WHERE user_id = ? AND menu_id = ?';
        await pool.query(deleteQuery, [userId, menuId]);

        res.redirect('/cart');
    } catch (error) {
        console.error("메뉴 삭제 실패", error);
        res.redirect('/error');
    }
};

exports.checkout = async(req, res) => {
    try {
        const userId = req.session.user.user_id;
        
        const cartListQuery = 'SELECT cl.*, m.menu_name, m.menu_price FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const cartList = await pool.query(cartListQuery, [userId]);

        const totalQuery = 'SELECT SUM(m.menu_price * cl.cart_list_quantity) AS total FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const totalResult = await pool.query(totalQuery, [userId]);

        res.render('checkout', { cart: cartList[0], total: totalResult[0][0].total });
    } catch (error) {
        console.error("결제 페이지 보기 실패", error);
        res.redirect('/error');
    }
}

exports.order = async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const paymentMethod = req.body.paymentMethod;

        // totalResult 계산
        const totalQuery = 'SELECT SUM(m.menu_price * cl.cart_list_quantity) AS total FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const totalResult = await pool.query(totalQuery, [userId]);

        // 주문 생성
        const orderQuery = 'INSERT INTO order_ (user_id, order_payment, order_total_price, order_time) VALUES (?, ?, ?, NOW())';
        const orderResult = await pool.query(orderQuery, [userId, paymentMethod, totalResult[0][0].total]);
        const orderId = orderResult[0].insertId;
        console.log(orderId);

        // 주문 상세 생성
        const cartListQuery = 'SELECT cl.*, m.menu_name, m.menu_price FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const cartList = await pool.query(cartListQuery, [userId]);

        for (let item of cartList[0]) {
            const orderListQuery = 'INSERT INTO order_list (order_id, menu_id, order_list_quantity, order_list_price) VALUES (?, ?, ?, ?)';
            await pool.query(orderListQuery, [orderId, item.menu_id, item.cart_list_quantity, item.menu_price * item.cart_list_quantity]);
        }

        // 장바구니 비우기
        const deleteQuery = 'DELETE FROM cart_list WHERE user_id = ?';
        await pool.query(deleteQuery, [userId]);

        // 주문 번호 전달
        res.render('order_complete', { orderId: orderId });

    } catch (error) {
        console.error("주문 실패", error);
        res.redirect('/error');
    }
};


