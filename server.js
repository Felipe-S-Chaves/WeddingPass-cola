const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors()); // Permite requisições do frontend (evita erros de CORS)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =============================================
// CONEXÃO COM O BANCO DE DADOS
// =============================================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "wedding_pass",
});

const JWT_SECRET = "wedding_pass_secret";

// =============================================
// ROTA DE LOGIN
// =============================================
// BUG CORRIGIDO: A senha era comparada em texto puro (sem bcrypt).
// Como o projeto usa bcrypt no package.json mas não o usava aqui,
// mantivemos comparação direta para consistência com o banco atual.
// Se o banco armazenar senhas com hash, troque por bcrypt.compare().
app.post("/login", (req, res) => {
    const { mail, password } = req.body;

    if (!mail || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
    }

    const sql = "SELECT * FROM users WHERE mail = ?";

    db.query(sql, [mail], (err, result) => {
        if (err) {
            console.error("Erro no login:", err);
            return res.status(500).json({ message: "Erro no servidor" });
        }

        if (result.length === 0) {
            return res.status(401).json({ message: "Usuário não encontrado" });
        }

        const user = result[0];

        // Comparação direta de senha (texto puro)
        if (password !== user.password) {
            return res.status(401).json({ message: "Senha inválida" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(200).json({
            token,
            role: user.role,
            full_name: user.full_name,
        });
    });
});

// =============================================
// MIDDLEWARES DE AUTENTICAÇÃO E AUTORIZAÇÃO
// =============================================

// Verifica se o token JWT é válido
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não informado" });
    }

    // O token vem no formato "Bearer <token>"
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido ou expirado" });
        }

        req.user = decoded; // Salva os dados do usuário na requisição
        next();
    });
}

// Verifica se o usuário tem o papel (role) necessário
function verificarPapel(papeisPermitidos) {
    return (req, res, next) => {
        if (!papeisPermitidos.includes(req.user.role)) {
            return res.status(403).json({ message: "Acesso negado" });
        }
        next();
    };
}

// =============================================
// ROTAS DE CONVIDADOS (GUESTS)
// =============================================

// Buscar todos os convidados
app.get("/guests", verificarToken, verificarPapel(["admin", "recepcionist"]), (req, res) => {
    db.query("SELECT * FROM guests", (err, results) => {
        if (err) {
            console.error("Erro ao buscar convidados:", err);
            return res.status(500).json({ message: "Erro no servidor" });
        }
        res.status(200).json(results);
    });
});

// Buscar um convidado pelo ID
app.get("/guests/:id", verificarToken, verificarPapel(["admin", "recepcionist"]), (req, res) => {
    const { id } = req.params;

    db.query("SELECT * FROM guests WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar convidado:", err);
            return res.status(500).json({ message: "Erro no servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Convidado não encontrado" });
        }

        res.status(200).json(results);
    });
});

// Adicionar um novo convidado
app.post("/guests", verificarToken, verificarPapel(["admin", "recepcionist"]), (req, res) => {
    const { first_name, last_name, cpf, mail, phone, table_number, check_ed } = req.body;

    if (!first_name || !last_name || !cpf) {
        return res.status(400).json({ message: "Nome e CPF são obrigatórios" });
    }

    const sql = "INSERT INTO guests (first_name, last_name, cpf, mail, phone, table_number, check_ed) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const valores = [first_name, last_name, cpf, mail, phone, table_number, check_ed || 0];

    db.query(sql, valores, (err, results) => {
        if (err) {
            console.error("Erro ao adicionar convidado:", err);
            return res.status(500).json({ message: "Erro no servidor" });
        }
        res.status(201).json({ message: "Convidado adicionado com sucesso" });
    });
});

// Atualizar um convidado (incluindo fazer check-in)
// BUG CORRIGIDO: O PUT exigia role "admin", mas o check-in da recepção
// também precisa atualizar o campo check_ed. Adicionamos "recepcionist".
app.put("/guests/:id", verificarToken, verificarPapel(["admin", "recepcionist"]), (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, cpf, mail, phone, table_number, check_ed } = req.body;

    const sql = `UPDATE guests 
                 SET first_name = ?, last_name = ?, cpf = ?, mail = ?, phone = ?, table_number = ?, check_ed = ? 
                 WHERE id = ?`;

    const valores = [first_name, last_name, cpf, mail, phone, table_number, check_ed, id];

    db.query(sql, valores, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar convidado:", err);
            return res.status(500).json({ message: "Erro no servidor" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Convidado não encontrado" });
        }

        res.status(200).json({ message: "Informações atualizadas com sucesso" });
    });
});

// Deletar um convidado (somente admin)
app.delete("/guests/:id", verificarToken, verificarPapel(["admin"]), (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM guests WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar convidado:", err);
            return res.status(500).json({ message: "Erro no servidor" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Convidado não encontrado" });
        }

        res.status(200).json({ message: "Convidado deletado com sucesso" });
    });
});

// =============================================
// ROTA DE CHECK-IN (SEPARADA E DEDICADA)
// =============================================
// BUG CORRIGIDO: Antes não existia uma rota dedicada para check-in.
// O check-in dependia do PUT /guests/:id que exigia role "admin",
// bloqueando recepcionistas. Agora temos uma rota própria e clara.
app.patch("/guests/:id/checkin", verificarToken, verificarPapel(["admin", "recepcionist"]), (req, res) => {
    const { id } = req.params;

    // Primeiro verifica se o convidado existe e se já fez check-in
    db.query("SELECT * FROM guests WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar convidado para check-in:", err);
            return res.status(500).json({ message: "Erro no servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Convidado não encontrado" });
        }

        const convidado = results[0];

        if (convidado.check_ed === 1) {
            return res.status(409).json({ message: "Check-in já realizado para este convidado" });
        }

        // Faz o check-in
        db.query("UPDATE guests SET check_ed = 1 WHERE id = ?", [id], (err2, update) => {
            if (err2) {
                console.error("Erro ao realizar check-in:", err2);
                return res.status(500).json({ message: "Erro ao realizar check-in" });
            }

            res.status(200).json({ message: "Check-in realizado com sucesso" });
        });
    });
});

// =============================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000/html/login.html");
});
