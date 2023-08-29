import pg from 'pg'
const { Pool } = pg

const conexion = new Pool ({
    host:"localhost",
    user: "postgres",
    password:"root",
    database: "car_dealership",
    port: "5432"
})

export default conexion