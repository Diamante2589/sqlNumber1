import Router from "express";
import {hola ,holaNombre, suma, apiBody, obtenerCars} from "../controllers/controllers.js"
const router = Router()

router.get("/hola",hola)


router.get("/hola/:nombre",holaNombre)

router.get("/suma/:x/:y",suma)

router.put("/api/body", apiBody)

router.post("/cars",obtenerCars)

export default router