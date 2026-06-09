const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");


const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")))

// conexao com o banco
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "wedding_pass",
})


const JWT_SECRET = "wedding_pass_secret"

// login
app.post("/login", (req, res) => {
    const { mail, password } = req.body
    const sql = "SELECT * FROM users WHERE mail = ?"

    db.query(sql, [mail], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Erro no servidor"
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                message: "Usuario nao encontrado"
            });
        }

        const user = result[0]

        if (password !== user.password) {
            return res.status(401).json({
                message: "Senha invalida"
            });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

        res.status(200).json({
            token,
            role: user.role,
            full_name: user.full_name
        })
    })
})


// middlewares
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            message: "token nao informado"
        });
    }

    const token = authHeader.split(" ")[1]

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                message: "Token invalido"
            });
        }

        req.user = decoded

        next()
    })
}

function authorizeRoles(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "acesso negado"
            })
        }

        next()
    }
}


// Gets
app.get("/guests", authenticateToken, authorizeRoles(["admin", "recepcionist"]), (req, res) => {

    db.query("SELECT * FROM guests", (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Erro no servidor"
            });
        }

        res.status(200).json(results);
    });

});

app.get("/guests/:id", authenticateToken, authorizeRoles(["admin", "recepcionist"]), (req, res) => {

    const { id } = req.params

    db.query("SELECT * FROM guests WHERE id = ?", [id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Erro no servidor"
            });
        }
        res.status(200).json(results);
    });

});

// post
app.post("/guests", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
    const { first_name, last_name, cpf, mail, table_number , check_ed} = req.body
    db.query("INSERT INTO guests (first_name, last_name, cpf, mail, table_number) VALUES (?,?,?,?,?)",
        [first_name, last_name, cpf, mail, table_number, check_ed], (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Erro no servidor"
                })
            }
            res.status(200).json({
                message: "Convidado adicionado com sucesso"
            })
        })
})


// put
app.put("/guests/:id", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
    const { id } = req.params
    const { first_name, last_name, cpf, mail, table_number , check_ed } = req.body
    db.query("UPDATE guests SET first_name = ?, last_name = ?, cpf = ?, mail = ?, table_number = ? WHERE id = ?",
        [first_name, last_name, cpf, mail, table_number, check_ed, id], (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Erro no servidor"
                })
            }
            res.status(200).json({
                message: "Informacoes alteradas com sucesso"
            })
        })
})



// delete
app.delete("/guests/:id", authenticateToken, authorizeRoles(["admin", "recepcionist"]), (req, res) => {

    const { id } = req.params

    db.query("DELETE FROM guests WHERE id = ?", [id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Erro no servidor"
            });
        }

        res.status(200).json({
            message: "Usuario Deletado com sucesso"
        });
    });

});

// inicialização do servidor
app.listen(3000, () => {
    console.log("Servidor rodando")
})