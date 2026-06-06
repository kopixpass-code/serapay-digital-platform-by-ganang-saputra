const axios = require("axios");

module.exports = function(app){

/*
=====================================
API SHOPEE MONITOR.JS
=====================================
*/
app.post("/api/account/add-cookie", async (req, res) => {

    try {

        const { cookie } = req.body;

        const response = await axios.get(
            "https://shopee.co.id/api/v4/account/basic/get_account_info",
            {
                headers: {
                    cookie,
                    "x-api-source": "pc",
                    "x-requested-with": "XMLHttpRequest"
                }
            }
        );

        res.json({
            success: true,
            data: response.data
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

/*
=====================================
GET ORDER LIST
=====================================
*/

app.post("/api/orders/list", async (req, res) => {

    try {

        const { cookie } = req.body;

const csrfToken =
    cookie.match(/csrftoken=([^;]+)/)?.[1] || "";

const response = await axios.get(
    "https://shopee.co.id/api/v4/order/get_order_list?_oft=2048&limit=20&list_type=8&offset=0",
    {
        headers: {
            cookie,
            "x-api-source": "pc",
            "x-requested-with": "XMLHttpRequest",
            "x-csrftoken": csrfToken,
            "referer": "https://shopee.co.id/user/purchase?type=8",
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36"
        }
    }
);

        res.json(response.data);

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

/*
=====================================
GET ORDER DETAIL
=====================================
*/

app.post("/api/orders/detail", async (req, res) => {

    try {

        const {
            cookie,
            orderId
        } = req.body;

const csrfToken =
    cookie.match(/csrftoken=([^;]+)/)?.[1] || "";

const response = await axios.get(
    `https://shopee.co.id/api/v4/order/get_order_detail?_oft=2048&order_id=${orderId}`,
    {
        headers: {
            cookie,
            "x-api-source": "pc",
            "x-requested-with": "XMLHttpRequest",
            "x-csrftoken": csrfToken,
            "referer": "https://shopee.co.id/user/purchase?type=8",
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36"
        }
    }
);

        res.json(response.data);

    } catch (err) {

console.log(
    err.response?.status,
    err.response?.data
);

res.status(500).json({
    success:false,
    status:err.response?.status,
    data:err.response?.data,
    error:err.message
});

    }

});

/*
=====================================
UPDATE MONITOR
=====================================
*/

app.post("/api/update", async (req, res) => {

    try {

        const { cookie } = req.body;

        console.log(
            "COOKIE OK:",
            cookie.includes("csrftoken=")
        );

        console.log(
            "COOKIE LENGTH:",
            cookie?.length
        );

        console.log(
            "COOKIE LAST 200:"
        );

        console.log(
            cookie?.slice(-200)
        );

        const csrfToken =
            cookie.match(/csrftoken=([^;]+)/)?.[1] || "";

        console.log("CSRF:", csrfToken);

const ordersResponse = await axios.get(
    "https://shopee.co.id/api/v4/order/get_all_order_and_checkout_list?_oft=2048&limit=5&offset=0",
    {
        headers: {
            cookie,
            "x-api-source": "pc",
            "x-requested-with": "XMLHttpRequest",
            "x-csrftoken": csrfToken,
            "referer": "https://shopee.co.id/user/purchase?type=8",
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36"
        }
    }
);

        const orders =
            ordersResponse.data.data.details_list || [];

        const result = [];

        for (const order of orders) {

            const orderId =
                order.info_card.order_id;

const detailResponse =
    await axios.get(
        `https://shopee.co.id/api/v4/order/get_order_detail?_oft=2048&order_id=${orderId}`,
        {
            headers: {
                cookie,
                "x-api-source": "pc",
                "x-requested-with": "XMLHttpRequest",
                "x-csrftoken": csrfToken,
                "referer": "https://shopee.co.id/user/purchase?type=8",
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36"
            }
        }
    );

const detail =
    detailResponse.data.data;

            result.push({

                orderId,

                shopName:
                    detail.info_card
                    .parcel_cards?.[0]
                    ?.shop_info?.shop_name,

                username:
                    detail.info_card
                    .parcel_cards?.[0]
                    ?.shop_info?.username,

                product:
                    detail.info_card
                    .parcel_cards?.[0]
                    ?.product_info
                    ?.item_groups?.[0]
                    ?.items?.[0]
                    ?.name,

                address:
                    detail.address
                    ?.shipping_address,

                receiver:
                    detail.address
                    ?.shipping_name,

                tracking:
                    detail.pc_shipping
                    ?.forder_shipping_info_list?.[0]
                    ?.tracking_info_list?.[0]
                    ?.description,

                status:
                    detail.status
                    ?.status_label
                    ?.text

            });

        }
		
		console.log(
    "UPDATE RESULT:",
    JSON.stringify(
        result,
        null,
        2
    )
);

        res.json({
            success: true,
            total: result.length,
            data: result
        });

    } catch (err) {

console.log(
    err.response?.status,
    err.response?.data
);

res.status(500).json({
    success:false,
    status:err.response?.status,
    data:err.response?.data,
    error:err.message
});

    }

});

/*
=====================================
PROFILE DEVELOPER
=====================================
*/

app.get("/api/profile", (req, res) => {

    res.json({

        nama: "Developer",
        id: "154516123123612",
        saldo: 587000,
        avatar: "/css/img/avatar1.png"

    });

});

};