const pool = require('../../DB/db');

    // 메인화면
    exports.main = async(req, res) =>{
        res.render('main', { user: req.session.user });

        try {
            // 일반 메뉴보기
            const menuName = req.query.menu_name;
            let q2, result;
            if (menuName) {
                q2 = 'SELECT * FROM menu WHERE menu_name LIKE ?';
                result = await pool.query(q2, ['%' + menuName + '%']);
            } else {
                q2 = 'SELECT * FROM menu';
                result = await pool.query(q2);
            }

            const bestMenuName = req.query_menu_name;
            const bestMenu = await pool.query('SELECT * FROM menU WHERE ')
    
        
    
            res.render("menu", {data: result[0], oneMenus: oneMenus, recommendMenus: recommendMenus, searchData: result[0]});
        } catch (error) {
            res.render("menu");
        }

        
    }

// 회원보기 (admin)
exports.viewUsers = async(req, res) => {
    if (req.session.user.is_admin) {
        const users = await pool.query('SELECT * FROM user');
        res.render('admin/users', {data: users[0]});
    } else {
        res.redirect('/error');
    }
}

// 메뉴보기
exports.menu = async(req, res) => {
    try {
        // 일반 메뉴보기
        const menuName = req.query.menu_name;
        let q2, result;
        if (menuName) {
            q2 = 'SELECT * FROM menu WHERE menu_name LIKE ?';
            result = await pool.query(q2, ['%' + menuName + '%']);
        } else {
            q2 = 'SELECT * FROM menu';
            result = await pool.query(q2);
        }

        // 대표메뉴, 추천메뉴, 재고여부 보기
        let oneMenus = [];
        let recommendMenus = [];



        for (let menu of result[0]) {
            if (menu.one_menu === 1) {
                oneMenus.push(menu);
            }
            if (menu.recommend_menu === 1) {
                recommendMenus.push(menu);
            }

            const ingredientsQuery = 'SELECT * FROM menu_ingredient WHERE menu_id = ?';
            const ingredients = await pool.query(ingredientsQuery, [menu.menu_id]);

            // 재고여부
            menu.isAvailable = true;
            for(let ingredient of ingredients[0]) {
                const stockQuery = 'SELECT ingredient_stock FROM ingredient WHERE ingredient_id = ?';
                const stock = await pool.query(stockQuery, [ingredient.ingredient_id]);

                if (stock[0][0].ingredient_stock < ingredient.ingredient_quantity) {
                    menu.isAvailable = false;
                    break;
                }
            }
        } 

        res.render("menu", {data: result[0], oneMenus: oneMenus, recommendMenus: recommendMenus, searchData: result[0]});
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

// 메뉴 관리 (admin)
exports.menuManagement = async(req,res) => {
    let searchData = [];  // searchData 초기화
    try {
        const menuName = req.query.menu_name;
        let q2;
        let data = [];
        if (menuName) {
            q2 = 'SELECT * FROM menu WHERE menu_name LIKE ?';
            const result = await pool.query(q2, ['%' + menuName + '%']);
            for (let menu of result[0]) {
                const ingredientsQuery = 'SELECT mi.*, i.ingredient_stock, i.ingredient_name, i.ingredient_order_unit, mi.menu_ingredient_volume AS ingredient_amount FROM menu_ingredient mi JOIN ingredient i ON mi.ingredient_id = i.ingredient_id WHERE mi.menu_id = ?';
                const ingredients = await pool.query(ingredientsQuery, [menu.menu_id]);
                menu.ingredients = ingredients[0];
            }
            
            searchData = result[0];
        }
        
        q2 = 'SELECT * FROM menu';
        const result = await pool.query(q2);
        for (let menu of result[0]) {
            const ingredientsQuery = 'SELECT mi.*, i.ingredient_stock, i.ingredient_name, i.ingredient_order_unit, mi.menu_ingredient_volume AS ingredient_amount FROM menu_ingredient mi JOIN ingredient i ON mi.ingredient_id = i.ingredient_id WHERE mi.menu_id = ?';
            const ingredients = await pool.query(ingredientsQuery, [menu.menu_id]);
            menu.ingredients = ingredients[0];
        }
        
        data = result[0];

        res.render("admin/menu_management", {data: data, searchData: searchData});
    } catch (error) {
        console.error(error);
        const data = await pool.query('SELECT * FROM menu');
        res.render("admin/menu_management", {data: data[0]});
    }
}

// 메뉴 추가 (admin)
exports.addMenu = async(req, res) => {
    if (req.session.user.is_admin) {
        const menuData = req.body;
        await pool.query('INSERT INTO menu SET ?', menuData);
        res.redirect('/admin/menu_management');
    } else {
        res.redirect('/error');
    }
}

// 메뉴 삭제 (admin)
exports.deleteMenu = async(req, res) => {
    if (req.session.user.is_admin) {
        const menuId = req.params.menu_id;
        await pool.query('DELETE FROM menu WHERE menu_id = ?', [menuId]);
        res.redirect('/admin/menu_management');
    } else {
        res.redirect('/error');
    }
}

// 추천 메뉴 설정 (admin)
exports.setRecommendMenu = async(req, res) => {
    try {
        // 먼저 모든 메뉴의 recommend_menu를 0으로 설정
        let resetQuery = 'UPDATE menu SET recommend_menu = 0';
        await pool.query(resetQuery);

        // 선택된 메뉴의 recommend_menu를 1로 설정
        let setQuery = 'UPDATE menu SET recommend_menu = 1 WHERE menu_id = ?';
        await pool.query(setQuery, [req.params.menu_id]);

        res.redirect('/admin/menu_management');  // 메뉴 관리 페이지로 리다이렉트
    } catch (error) {
        console.error(error);
        res.redirect('/admin/menu_management');
    }
}

// 재료 재고 관리 (admin)
exports.ingredientManagement = async(req,res) => {
    let suppliers = [];
    let searchData = []
    try {
        const menuName = req.query.menu_name;
        let q2;
        let data = [];
        if (menuName) {
            q2 = 'SELECT * FROM menu WHERE menu_name LIKE ?';
            const result = await pool.query(q2, ['%' + menuName + '%']);
            for (let menu of result[0]) {
                const ingredientsQuery = 'SELECT mi.*, i.ingredient_stock, i.ingredient_name, mi.menu_ingredient_volume AS ingredient_amount FROM menu_ingredient mi JOIN ingredient i ON mi.ingredient_id = i.ingredient_id WHERE mi.menu_id = ?';
                const ingredients = await pool.query(ingredientsQuery, [menu.menu_id]);
                menu.ingredients = ingredients[0];
            }
            
            searchData = result[0];
        }
        
        q2 = 'SELECT * FROM menu';
        const result = await pool.query(q2);
        for (let menu of result[0]) {
            const ingredientsQuery = 'SELECT mi.*, i.ingredient_stock, i.ingredient_name, i.ingredient_order_unit, i.ingredient_order_quantity, mi.menu_ingredient_volume AS ingredient_amount FROM menu_ingredient mi JOIN ingredient i ON mi.ingredient_id = i.ingredient_id WHERE mi.menu_id = ?';
            const ingredients = await pool.query(ingredientsQuery, [menu.menu_id]);
            menu.ingredients = ingredients[0];
        }
        
        data = result[0];

        // 공급업체와 재료 정보 가져오기
        const suppliersQuery = 'SELECT s.*, si.ingredient_id, i.ingredient_name, i.ingredient_stock, i.ingredient_order_quantity, i.ingredient_order_unit, si.supply_price_per_unit FROM supplier s JOIN supply si ON s.supplier_id = si.supplier_id JOIN ingredient i ON si.ingredient_id = i.ingredient_id';
        const suppliersResult = await pool.query(suppliersQuery);
        for (let supplier of suppliersResult[0]) {
            const index = suppliers.findIndex(s => s.supplier_id === supplier.supplier_id);
            if (index === -1) {
                suppliers.push({
                    supplier_id: supplier.supplier_id,
                    supplier_name: supplier.supplier_name,
                    ingredients: [{
                    ingredient_id: supplier.ingredient_id,
                    ingredient_name: supplier.ingredient_name,
                    ingredient_stock: supplier.ingredient_stock,
                    ingredient_order_quantity: supplier.ingredient_order_quantity,
                    ingredient_order_unit: supplier.ingredient_order_unit,
                    supply_price_per_unit: supplier.supply_price_per_unit
                    }]
                });
            } else {
                suppliers[index].ingredients.push({
                    ingredient_id: supplier.ingredient_id,
                    ingredient_name: supplier.ingredient_name,
                    ingredient_stock: supplier.ingredient_stock,
                    ingredient_order_quantity: supplier.ingredient_order_quantity,
                    ingredient_order_unit: supplier.ingredient_order_unit,
                    supply_price_per_unit: supplier.supply_price_per_unit
                });
            }
        }

        // 재료 주문 내역
        const orderHistoryQuery = 'SELECT * FROM supply_list ORDER BY supply_list_id ASC';
        const orderHistoryResult = await pool.query(orderHistoryQuery);
        const orderHistory = orderHistoryResult[0];

        res.render("admin/ingredient_management", {suppliers: suppliers, data: data, searchData: searchData, orderHistory: orderHistory});
    } catch (error) {
        console.error(error);
    }
}

// 재료 주문 (admin)
exports.orderIngredient = async (req, res) => {
    const { ingredient_id, supplier_id, supply_list_amount } = req.body;
    try {
      // 현재 날짜에서 1~5의 랜덤한 날짜를 더함
      const delivery_date = new Date();
      delivery_date.setDate(delivery_date.getDate() + Math.floor(Math.random() * 5) + 1);

      // 주문한 재료의 재고량 업데이트
      const query = 'UPDATE ingredient SET ingredient_stock = ingredient_stock + ingredient_order_quantity * ? WHERE ingredient_id = ?';
      await pool.query(query, [supply_list_amount, ingredient_id]);
  
      // 주문 기록 추가
      const orderQuery = 'INSERT INTO supply_list (supplier_id, ingredient_id, supply_list_amount, delivery_date) VALUES (?, ?, ?, ?)';
      await pool.query(orderQuery, [supplier_id, ingredient_id, supply_list_amount, delivery_date]);
  
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
};


  

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

// 로그아웃
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

// 장바구니 조회
exports.getCart = async(req, res) => {
    try {
        const userId = req.session.user.user_id;

        const cartListQuery = 'SELECT cl.*, m.menu_name, m.menu_price FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const cartList = await pool.query(cartListQuery, [userId]);

        const totalQuery = 'SELECT SUM(m.menu_price * cl.cart_list_quantity) AS total FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?' ;
        const totalResult = await pool.query(totalQuery, [userId]);

        res.render('cart', { cart: cartList[0], total: totalResult[0][0].total });
    } catch (error) {
        console.error("장바구니 보기 실패", error);
        res.redirect('/error');
    }
}

// 장바구니 넣기
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

// 장바구니 수정
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

// 장바구니 메뉴 삭제
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

// 결제
exports.checkout = async(req, res) => {
    try {
        const userId = req.session.user.user_id;
        
        const cartListQuery = 'SELECT cl.*, m.menu_name, m.menu_price FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const cartList = await pool.query(cartListQuery, [userId]);

        const totalQuery = 'SELECT SUM(m.menu_price * cl.cart_list_quantity) AS total FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const totalResult = await pool.query(totalQuery, [userId]);

        // 적립금 잔액 확인
        const rewardPointsQuery = 'SELECT reward_points FROM user WHERE user_id = ?';
        const rewardPointsResult = await pool.query(rewardPointsQuery, [userId]);
        const rewardPoints = rewardPointsResult[0][0].reward_points;

        // 현재 스탬프 수 확인
        const userQuery = 'SELECT reward_stamps FROM user WHERE user_id = ?';
        const userResult = await pool.query(userQuery, [userId]);
        const rewardStamps = userResult[0][0].reward_stamps;

        res.render('checkout', { cart: cartList[0], total: totalResult[0][0].total, rewardPoints: rewardPoints, rewardStamps: rewardStamps }); // 이 줄을 수정합니다.
    } catch (error) {
        console.error("결제 페이지 보기 실패", error);
        res.redirect('/error');
    }
}


// 주문
exports.order = async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const paymentMethod = req.body.paymentMethod;
        const usedPoints = req.body.usedPoints ? parseInt(req.body.usedPoints) : 0;

        // 적립금 사용 가능한지 확인
        const rewardPointsQuery = 'SELECT reward_points FROM user WHERE user_id = ?';
        const rewardPointsResult = await pool.query(rewardPointsQuery, [userId]);
        const currentPoints = rewardPointsResult[0][0].reward_points;
        
        if (usedPoints > currentPoints) {
            return res.redirect('/cart');
        }

        // 현재 스탬프 수 확인
        const userQuery = 'SELECT reward_stamps FROM user WHERE user_id = ?';
        const userResult = await pool.query(userQuery, [userId]);
        const currentStamps = userResult[0][0].reward_stamps;

        // 스탬프 < 10
        if (currentStamps < 10 && usedPoints > 0) {
            return res.redirect('/cart');
        }

        // totalResult 계산
        const totalQuery = 'SELECT SUM(m.menu_price * cl.cart_list_quantity) AS total FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const totalResult = await pool.query(totalQuery, [userId]);

        // 적립금 사용액을 반영한 총액 계산
        const finalTotal = totalResult[0][0].total - usedPoints;

        // 사용 적립금과 남은 적립금 계산
        const usedRewardPoints = usedPoints;
        const remainingRewardPoints = currentPoints - usedPoints;

        // 주문 생성
        const orderQuery = 'INSERT INTO order_ (user_id, order_payment, order_total_price, reward_points_used, order_date) VALUES (?, ?, ?, ?, NOW())';
        const orderResult = await pool.query(orderQuery, [userId, paymentMethod, totalResult[0][0].total - usedRewardPoints, usedRewardPoints]);
        const orderId = orderResult[0].insertId;

        // 주문 상세 생성
        const cartListQuery = 'SELECT cl.*, m.menu_name, m.menu_price FROM cart_list cl JOIN menu m ON cl.menu_id = m.menu_id WHERE cl.user_id = ?';
        const cartList = await pool.query(cartListQuery, [userId]);

        let totalQuantity = 0;
        let orderDetails = [];

        for (let item of cartList[0]) {
            const orderListQuery = 'INSERT INTO order_list (order_id, menu_id, order_list_quantity, order_list_price) VALUES (?, ?, ?, ?)';
            await pool.query(orderListQuery, [orderId, item.menu_id, item.cart_list_quantity, item.menu_price * item.cart_list_quantity]);
            totalQuantity += item.cart_list_quantity;
        
            // 주문 상세 정보를 orderDetails 배열에 추가
            orderDetails.push({
                menuName: item.menu_name,
                quantity: item.cart_list_quantity,
                price: item.menu_price * item.cart_list_quantity
            });
        
            // 재료 차감 처리
            const ingredientsQuery = 'SELECT * FROM menu_ingredient WHERE menu_id = ?';
            const ingredients = await pool.query(ingredientsQuery, [item.menu_id]);
            
            for(let ingredient of ingredients[0]) {
                const updateQuery = 'UPDATE ingredient SET ingredient_stock = ingredient_stock - ? WHERE ingredient_id = ?';
                await pool.query(updateQuery, [ingredient.menu_ingredient_volume * item.cart_list_quantity, ingredient.ingredient_id]);
            }
        }

        // 적립금 및 스탬프 추가
        const rewardPoints = finalTotal * 0.1;
        const usedStamps = usedPoints > 0 ? 10 : 0;
        const updateRewardQuery = 'UPDATE user SET reward_points = reward_points + ? - ?, reward_stamps = reward_stamps + ? - ? WHERE user_id = ?';
        await pool.query(updateRewardQuery, [rewardPoints, usedPoints, totalQuantity, usedStamps, userId]);

        // 적립금 사용 기록
        if (usedRewardPoints > 0) {
            const rewardHistoryUseQuery = 'INSERT INTO reward_history (user_id, history_date, description, reward_point, reward_stamp) VALUES (?, NOW(), ?, ?, ?)';
            await pool.query(rewardHistoryUseQuery, [userId, '주문시 적립금 사용', -usedRewardPoints, 0]);
        }

        // 스탬프 사용 기록
        if (usedPoints > 0) {
            const rewardHistoryStampQuery = 'INSERT INTO reward_history (user_id, history_date, description, reward_point, reward_stamp) VALUES (?, NOW(), ?, ?, ?)';
            await pool.query(rewardHistoryStampQuery, [userId, '주문시 스탬프 사용', 0, -10]);
        }

        // 적립금 적립 기록
        if (rewardPoints > 0) {
            const rewardHistoryAddQuery = 'INSERT INTO reward_history (user_id, history_date, description, reward_point, reward_stamp) VALUES (?, NOW(), ?, ?, ?)';
            await pool.query(rewardHistoryAddQuery, [userId, '주문시 적립금 적립', +rewardPoints, 0]);
        }

        // 스탬프 적립 기록
        const rewardStamps = totalQuantity;
        if (rewardStamps > 0) {
            const rewardHistoryStampAddQuery = 'INSERT INTO reward_history (user_id, history_date, description, reward_point, reward_stamp) VALUES (?, NOW(), ?, ?, ?)';
            await pool.query(rewardHistoryStampAddQuery, [userId, '주문시 스탬프 적립', 0, rewardStamps]);
        }

        // 적립금 잔액 다시 불러오기
        const rewardPointsResultUpdated = await pool.query(rewardPointsQuery, [userId]);
        const remainingRewardPointsUpdated = rewardPointsResultUpdated[0][0].reward_points;

        // 스탬프 잔액 다시 불러오기
        const userResultUpdated = await pool.query(userQuery, [userId]);
        const remainingRewardStampsUpdated = userResultUpdated[0][0].reward_stamps;


        // 장바구니 비우기
        const deleteQuery = 'DELETE FROM cart_list WHERE user_id = ?';
        await pool.query(deleteQuery, [userId]);

        // 주문 번호 전달
        res.render('order_complete', { orderId: orderId, orderDetails: orderDetails, usedRewardPoints: usedRewardPoints, remainingRewardPoints: remainingRewardPointsUpdated, remainingRewardStamps: remainingRewardStampsUpdated });

    } catch (error) {
        console.error("주문 실패", error);
        res.redirect('/error');
    }
};

// 주문 목록 보기
exports.viewOrders = async(req, res) => {
    if (req.session.user.is_admin) {
        const orders = await pool.query('SELECT * FROM order_');
        res.render('admin/orders', {orders: orders[0]});
    } else {
        res.redirect('/error');
    }
}

// 메뉴 검색
exports.searchMenu = async(req, res) => {
    try {
        const menuName = req.query.menu_name;
        const q5 = 'SELECT * FROM menu WHERE menu_name LIKE ?';

        const result = await pool.query(q5, ['%' + menuName + '%']);

        res.render("menu", {searchData: result[0]});
    } catch (error) {
        res.render("menu");
    }
};

// 적립금 조회
exports.getRewardStatus = async(req, res) => {
    try {
        const userId = req.session.user.user_id;

        const rewardStatusQuery = 'SELECT reward_points, reward_stamps FROM user WHERE user_id = ?';
        const rewardStatusResult = await pool.query(rewardStatusQuery, [userId]);

        const rewardHistoryQuery = 'SELECT * FROM reward_history WHERE user_id = ? ORDER BY history_date DESC';
        const rewardHistoryResult = await pool.query(rewardHistoryQuery, [userId]);
        
        res.render('reward_status', { rewardStatus: rewardStatusResult[0][0], rewardHistory: rewardHistoryResult[0] });
    } catch (error) {
        res.redirect('/error');
    }
};

// 사용 적립금
exports.useRewardPoints = async(req, res) => {
    try {
        const userId = req.session.user.user_id;
        const pointsToUse = parseInt(req.body.points);

        if (pointsToUse % 1000 !== 0) {
            res.redirect('/error');
        }

        const currentStampsQuery = 'SELECT reward_stamps FROM user WHERE user_id = ?';
        const currentStampsResult = await pool.query(currentStampsQuery, [userId]);
        if (currentStampsResult[0][0].reward_stamps < 10) {
            return res.redirect('/error');
        }

        const usePointsQuery = 'UPDATE user SET reward_points = reward_points - ?, reward_stamps = reward_stamps - 10 WHERE user_id = ?';
        await pool.query(usePointsQuery, [pointsToUse, userId]);

        const insertHistoryQuery = 'INSERT INTO reward_history (user_id, history_date, description, amount) VALUES (?, NOW(), ?, ?)';
        await pool.query(insertHistoryQuery, [userId, "적립금 사용", -pointsToUse]);

        res.redirect('/reward_points');
    } catch (error) {
        res.redirect('/error')
    }
}

// 적립금 기록 조회 (admin)
exports.viewRewardHistoryAdmin = async(req, res) => {
    if (req.session.user.is_admin) {
        const viewAllHistoryQuery = 'SELECT * FROM reward_history';
        const allHistoryResult = await pool.query(viewAllHistoryQuery);

        res.render('reward_history_admin', {allHistory: allHistoryResult[0]});
    } else {
        res.redirect('/error');
    }
}

exports.bestMenu = async (req, res) => {
    try {
        const rankingQuery = `
            SELECT
                menu.menu_name,
                SUM(order_list.order_list_quantity) AS order_count
            FROM
                menu
            LEFT JOIN
                order_list ON menu.menu_id = order_list.menu_id
            GROUP BY
                menu.menu_id
            ORDER BY
                order_count DESC
            LIMIT 2;
        `;

        const [rankingResults] = await pool.query(rankingQuery);

        if (rankingResults.length > 0) {
            res.render('bestMenu', { rankings: rankingResults });
        } else {
            res.render('bestMenu', { rankings: [] }); // 또는 다른 처리를 수행하도록 변경
        }
    } catch (error) {
        console.error('메뉴 랭킹 조회 중 오류 발생: ', error);
        res.status(500).send('메뉴 랭킹 조회 중 오류가 발생했습니다.');
    }
};

