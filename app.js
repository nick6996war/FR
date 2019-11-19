// Краткое описание
// Приложение Node.js - простой публичный чат.
// Где прошедшие проверку подлинности пользователи могут публиковать текст, а все остальные могут их читать.
// Сообщения хранятся в базе данных mongodb, и пользователи могут получать или создавать сообщения с помощью API REST.

// ● Сообщение содержыт имя пользователя и текст.
// ● Перед сохранением записи убедитесь, что текст содержит не более 200 символов, 
//    а имя пользователя содержит только буквы и цифры.

// ● REST API имеtт 2 конечные точки:
// 1. Получить все сообщения (с нумерацией страниц).
// 2. Создать пост. Должен возвращать ошибку, если текст или имя пользователя не прошли проверку.

//Подключаем cтронние модули
const MongoClient = require("mongodb").MongoClient;
const express = require("express")
const cors = require("cors")
const bodyParser = require('body-parser')
const fs = require('fs')
const jwt = require('jsonwebtoken');

const app = express()
const mongoUrl = 'mongodb+srv://root:qCx0C2UJOHRNpf41@cluster0-dterg.mongodb.net/test?retryWrites=true&w=majority'
const privateKey = 'snfj2ncjn9k0xz'
const messageOnList = 5
const regexp = /^[A-Za-zА-ЯЁа-яё0-9]*$/gi
let corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


//универсальная функция для обращения к базе даных 
async function DB(login, article, collection, tup) {
    const client = await MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, { useNewUrlParser: true })
        .catch(err => { console.log(err) })
    let coll = collection
    let tupe = tup
    try {
        const db = client.db("chat")
        const collection = db.collection(coll)

        if (tupe == 'auch') res = await collection.findOne({ login: login })
        else if (tupe == 'read') res = await collection.find().toArray()
        else if (tupe == 'write') res = collection.insertOne({ name: login, article: article })

    } catch (err) {
        console.log(err)
    } finally {
        client.close()
    }
    return res
}

function generateToken(req) {
    return jwt.sign({ foo: req }, privateKey)
}

app.all('*', async function (req, res) {
    console.log(req, res)
    let answer
    // для чистоты кода 
    let user
    let numberPage
    let token
    let article
    let password

    if (req.body.user)  user = req.body.user
    if (req.body.pg)  numberPage = req.body.pg
    if (req.body.token)  token = req.body.token
    if (req.body.article)  article = req.body.article
    if (req.body.password)  password = req.body.password

    // Получаем и разбираем URL возможно использование многоуровневого URL
    let pathArr = await req.originalUrl.split('/')
    let resource
    if (pathArr[1])  resource = pathArr[1]


    if (req.method == 'GET') {
        messageArray = await DB('', '', 'article', 'read')
        if (messageArray.length < messageOnList) {
            answer = messageArray
        } else {
            if (numberPage * messageOnList < messageArray.length)
                answer = messageArray.slice((numberPage - 1) * messageOnList, numberPage * messageOnList)
            else answer = messageArray.slice((numberPage - 1) * messageOnList, messageArray.length)
        }

    }
    else if (req.method == 'POST' && req.body) {
        if (resource == 'auth') {
            //проверяем что б имя пользователя состояло только из чисе и букв 
            if (regexp.test(user)) {
                let userData = await DB(user, '', 'users', 'auch')
                if (userData.pass === password) {
                    let userToken = generateToken(user)
                    answer = userToken
                } else answer = 'wrong pass'
            } else answer = 'wrong name'

        } else if (resource == 'add') {
            if (token) {
                if (article.length < 200) {
                    jwt.verify(token, privateKey, async function (err, decoded) {
                        if (!err) {
                           let insert= DB(user,article,'article','write',)
                            answer = {'successful':insert}
                        } else answer = {'wrong token':err}
                    })
                } else {
                    answer = 'text is too long'
                }
            }
        }

    }
    res.send(answer)
})

app.listen(8080, function () {
    console.log("Сервер ожидает подключения...")
})