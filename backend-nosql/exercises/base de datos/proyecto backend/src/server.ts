import express, {Application, NextFunction, Request, Response} from 'express';
import mongoose, {ConnectOptions, Schema} from 'mongoose';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app: Application = express();
const port: number = Number(process.env.PORT) || 3000;

declare global {
    namespace Express {
        interface Request {
            user?: any; // Declara la propiedad 'user' en el objeto Request
        }
    }
}

// Configuración de CORS
const corsOptions: cors.CorsOptions = {
    origin: '*', // Reemplaza con el origen de tu aplicación en el frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    credentials: true, // Habilita el envío de cookies y encabezados de autenticación
    optionsSuccessStatus: 204, // Configura el código de estado para las solicitudes OPTIONS
};

app.use(cors(corsOptions));

const dbOptions: ConnectOptions = {
    // @ts-ignore
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

mongoose.connect('mongodb+srv://xx1196:1234567890@cluster0.cypou2t.mongodb.net/inventory', dbOptions)
    .then(() => {
        console.log('Conexión exitosa a MongoDB');
    })
    .catch((error) => {
        console.error('Error al conectar a MongoDB', error);
    });

app.use(bodyParser.json());

// Modelo de categoría
interface ICategory extends Document {
    _id: Schema.Types.ObjectId;
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
}

// Modelo de product
// Interfaz para el modelo de Producto
interface IProduct extends Document {
    _id: Schema.Types.ObjectId;
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    category: ICategory['_id'];
}

const CategorySchema: Schema = new Schema({
    name: String,
    code: String,
});

// Personaliza la transformación del documento JSON
CategorySchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id; // Agrega la propiedad 'id' con el valor de '_id'
        delete ret.__v; // Elimina '__v' si lo deseas
        return ret;
    },
});

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    code: {type: String, required: true},
    category: {type: mongoose.Schema.Types.ObjectId, ref: 'Category'}, // Referencia a la categoría
});
// Personaliza la transformación del documento JSON
productSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id; // Agrega la propiedad 'id' con el valor de '_id'
        delete ret._v; // Elimina '_v' si lo deseas
        return ret;
    },
});
const Product = mongoose.model<IProduct>('Product', productSchema);

const Category = mongoose.model<ICategory>('Category', CategorySchema);

// Rutas para autenticación y generación de tokens JWT
app.post('/login', (req: Request, res: Response) => {
    const {username, password} = req.body;
    // Aquí deberías verificar las credenciales del usuario en tu base de datos

    // Si las credenciales son válidas, genera un token JWT
    const token = jwt.sign({username}, 'secreto_secreto', {expiresIn: '1h'});
    res.json({token});
});

// Middleware para verificar el token JWT en las rutas protegidas
function verifyToken(req: Request, res: Response, next: NextFunction) {
    /*const token = req.header('Authorization');

    if (!token) {
        return res.status(403).json({message: 'Acceso denegado. Token no proporcionado.'});
    }

    jwt.verify(token, 'secreto_secreto', (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({message: 'Token inválido.'});
        }
        req.user = decoded;
        next();
    });*/
    next();

}

// Rutas protegidas para CRUD de categorías
app.get('/categories', verifyToken, async (req: Request, res: Response) => {
    console.log('fetching categories')
    try {
        const categorias = await Category.find();
        console.log('success categories')
        res.json(categorias);
    } catch (error) {
        console.log('Error categories', {error})
        res.status(500).json({message: 'Error al obtener categorías.'});
    }
});

app.get('/categories/:id', verifyToken, async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Realiza una búsqueda en la base de datos para obtener la categoría por su ID
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({message: 'Categoría no encontrada'});
        }

        res.json(category);
    } catch (error) {
        console.error('Error al obtener la categoría por ID', error);
        res.status(500).json({message: 'Error interno del servidor'});
    }
});

app.post('/categories', verifyToken, async (req: Request, res: Response) => {
    const {name, code} = req.body;
    const category = new Category({name, code});//cammel case nestorBernalCabas, snake case: nestor_bernal_cabas, pascal case NestorBernalCabas
    try {
        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({message: 'Error al crear la categoría.'});
    }
});

app.put('/categories/:id', verifyToken, async (req: Request, res: Response) => {
    const {name, code} = req.body;
    const {id} = req.params;
    console.log({name, code})
    try {
        const category = await Category.findByIdAndUpdate(id, {name, code}, {new: true});
        res.json(category);
    } catch (error) {
        res.status(500).json({message: 'Error al actualizar la categoría.'});
    }
});

app.delete('/categories/:id', verifyToken, async (req: Request, res: Response) => {
    const {id} = req.params;
    try {
        await Category.findByIdAndDelete(id);
        res.json({message: 'Categoría eliminada con éxito.'});
    } catch (error) {
        res.status(500).json({message: 'Error al eliminar la categoría.'});
    }
});


// Ruta para crear un producto
app.post('/products', verifyToken, async (req: Request, res: Response) => {
    try {
        const {name, code, categoryId} = req.body;
        const product = new Product({name, code, category: categoryId});

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({message: 'Error al crear el producto.'});
    }
});

// Ruta para listar productos
app.get('/products', async (req:Request, res: Response) => {
    try {
        const products = await Product.find().populate('category');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({message: 'Error al listar los productos.'});
    }
});

app.get('/products/:id', verifyToken, async (req, res) => {
    try {
        const productCode = req.params.id;

        // Realiza una búsqueda en la base de datos para obtener la categoría por su ID
        const product = await Product.findById(productCode);

        if (!product) {
            return res.status(404).json({message: 'Producto no encontrada'});
        }

        res.json(product);
    } catch (error) {
        console.error('Error al obtener el producto  por Codigo', error);
        res.status(500).json({message: 'Error interno del servidor'});
    }
});
app.put('/products/:code', async (req: Request, res: Response)=>{
    
    try {
        const productCode = req.params.code
        const {name,code}=req.body
        const product = await Product.findByIdAndUpdate(productCode,{name,code},{new:true})

        res.json(product)
    } catch (error) {
        res.status(500).json({message: 'Error al actualizar el producto.'});
    }
})

app.delete('/products/:code',async (req:Request, res: Response) =>{
    const {code} =req.params
    try {
        await Product.findByIdAndDelete(code);
        res.json({message: 'Producto eliminado con éxito.'});
    } catch (error) {
        res.status(500).json({message: 'Error al eliminar la producto.'});
    }
})

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
