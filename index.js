import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';
import cors from 'cors';
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server); 

app.use(cors());
app.use(express.json()); 

const connections = new Map();

// Demo purposes only
// app.use(express.static('C:/Users/Rushikesh/OneDrive/Desktop/main-project/InstaMetrics_Backend/public'));

io.on('connection', (socket) => {
    const requestId = Math.random().toString(36).substring(7);
    connections.set(requestId, socket);

    socket.emit('requestId', { type: 'requestId', requestId });

    socket.on('disconnect', () => {
        connections.delete(requestId);
    });
});

app.get('/', (req, res) => {
    res.send('Hello World');
});



app.post('/chat', async (req, res) => {
    const { input_value, requestId } = req.body;
    const socket = connections.get(requestId);

    if (!socket) {
        return res.status(400).json({ error: 'Socket connection not found' });
    }
 
    try {
        console.log('Received input_value:', input_value);
        console.log('Received requestId:', requestId);
        const response = await axios.post(
            // Replace it with  OpenAI API endpoint
            'https://api.langflow.astra.datastax.com/lf/12b2e530-ffec-46bc-970b-5c208f8f5e43/api/v1/run/67c26750-9b21-4313-8eda-ef2b2760069f?stream=false',
            {
                input_value,
                output_type: 'chat',
                input_type: 'chat',
                tweaks: {
                    "ParseData-bU2Lk": {},
                    "SplitText-s45X9": {},
                    "OpenAIModel-Bunci": {},
                    "ChatOutput-8sI0F": {},
                    "AstraDB-66x6b": {},
                    "File-j3YRd": {},
                    "ChatInput-iAwEu": {},
                    "CombineText-1kBZ6": {},
                    "TextInput-upHmt": {}
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Application-token rquired
                    'Authorization': `Bearer ${process.env.APPLICATION_TOKEN}`
                }
            }
        );

        const message = response.data.outputs[0].outputs[0].results.message.text;

        socket.emit('response', { type: 'response', message });
        res.json({ status: 'Processing' });

    } catch (error) {
        socket.emit('error', { type: 'error', message: error.message });
        res.status(500).json({ error: error.message });
        console.log(error);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
