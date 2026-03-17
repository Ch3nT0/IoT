const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

/**
 * @swagger
 * tags:
 *   - name: Sensors
 *     description: API lay du lieu cam bien
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SensorDataItem:
 *       type: object
 *       properties:
 *         ID:
 *           type: integer
 *           example: 55
 *         SensorName:
 *           type: string
 *           example: Nhiet do
 *         Value:
 *           type: number
 *           example: 28.5
 *         CreateAt:
 *           type: string
 *           format: date-time
 *           example: "2026-03-17T08:22:35.000Z"
 */

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     tags: [Sensors]
 *     summary: Lay du lieu cam bien
 *     description: >
 *       Ho tro filter theo khoang thoi gian (range), ten cam bien (sensor),
 *       tim kiem gia tri/thoi gian (search) va phan trang (limit + page).
 *       Neu khong truyen limit/page, mac dinh tra ve 90 ban ghi moi nhat.
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: ["30days"]
 *         required: false
 *         description: Loc du lieu trong 30 ngay gan nhat.
 *         example: 30days
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Tim theo gia tri cam bien hoac chuoi thoi gian (CreateAt).
 *         example: "2026-03-17"
 *       - in: query
 *         name: sensor
 *         schema:
 *           type: string
 *         required: false
 *         description: Ten cam bien can loc (khop chinh xac voi cot Sensor.Name).
 *         example: Nhiet do
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: So ban ghi moi trang (phai truyen kem page).
 *         example: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: So trang hien tai (phai truyen kem limit).
 *         example: 1
 *     responses:
 *       200:
 *         description: Thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 200
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 20
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorDataItem'
 *       500:
 *         description: Loi server
 */
router.get('/', sensorController.getAllData);

module.exports = router;