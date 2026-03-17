const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

/**
 * @swagger
 * tags:
 *   - name: Devices
 *     description: API dieu khien va lich su thiet bi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DeviceActionHistoryItem:
 *       type: object
 *       properties:
 *         ID:
 *           type: integer
 *           example: 101
 *         DeviceName:
 *           type: string
 *           example: Den phong khach
 *         Action:
 *           type: string
 *           enum: ["ON", "OFF"]
 *           example: ON
 *         Status:
 *           type: string
 *           enum: ["Processing", "Success", "Fail"]
 *           example: Success
 *         CreateAt:
 *           type: string
 *           format: date-time
 *           example: "2026-03-17T08:22:35.000Z"
 *     DeviceControlRequest:
 *       type: object
 *       required:
 *         - DeviceID
 *         - Action
 *       properties:
 *         DeviceID:
 *           type: integer
 *           example: 1
 *         Action:
 *           type: string
 *           enum: ["ON", "OFF"]
 *           example: ON
 *     DeviceControlResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Lenh da duoc gui, dang cho phan hoi...
 *         historyId:
 *           type: integer
 *           example: 123
 */

/**
 * @swagger
 * /api/devices:
 *   get:
 *     tags: [Devices]
 *     summary: Lay lich su dieu khien thiet bi
 *     description: Ho tro filter theo search, deviceId, status va phan trang.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Tim theo chuoi thoi gian (format du lieu CreateAt).
 *         example: "2026-03-17"
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID thiet bi can loc.
 *         example: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["Processing", "Success", "Fail"]
 *         required: false
 *         description: Trang thai hanh dong.
 *         example: Success
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: So ban ghi moi trang.
 *         example: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: So trang hien tai.
 *         example: 1
 *     responses:
 *       200:
 *         description: Thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeviceActionHistoryItem'
 *                 total:
 *                   type: integer
 *                   example: 53
 *                 totalPages:
 *                   type: integer
 *                   example: 6
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Loi server
 */
router.get('/', deviceController.getAllData);

/**
 * @swagger
 * /api/devices/control:
 *   post:
 *     tags: [Devices]
 *     summary: Dieu khien thiet bi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceControlRequest'
 *     responses:
 *       200:
 *         description: Gui lenh thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceControlResponse'
 *       400:
 *         description: Thieu DeviceID hoac Action
 *       500:
 *         description: Loi server
 */
router.post('/control', deviceController.controlDevice);

/**
 * @swagger
 * /api/devices/status:
 *   get:
 *     tags: [Devices]
 *     summary: Lay trang thai moi nhat cua tung thiet bi
 *     responses:
 *       200:
 *         description: Thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 "1":
 *                   type: string
 *                   example: ON
 *                 "2":
 *                   type: string
 *                   example: OFF
 *                 "3":
 *                   type: string
 *                   example: Processing
 *       500:
 *         description: Loi server
 */
router.get('/status', deviceController.getLatestDeviceStatus);

module.exports = router;