package ir.iust.computer.network.darichesignalling.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.iust.computer.network.darichesignalling.model.SignalType;
import ir.iust.computer.network.darichesignalling.model.SignallingMessage;
import ir.iust.computer.network.darichesignalling.model.User;
import ir.iust.computer.network.darichesignalling.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class SocketHandler extends TextWebSocketHandler {
    @Autowired
    private UserService userService;
    private List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws InterruptedException, IOException {
        SignallingMessage signallingMessage = objectMapper.readValue(message.getPayload(), SignallingMessage.class);
        if (signallingMessage.getSignalType().equals(SignalType.LOGIN)) {
            User user = userService.getUserByUserName(signallingMessage.getData());
            synchronized (this) {
                if (user.getSessionId().isEmpty()) {
                    userService.setSessionId(user.getId(),session.getId());
                }
            }
        } else {
            User destUser = userService.getUserByUserName(signallingMessage.getDestUserName());
            for (WebSocketSession webSocketSession : sessions) {
                if (webSocketSession.getId().equals(destUser.getSessionId())) {
                    webSocketSession.sendMessage(message);
                    break;
                }
            }
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
    }


    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        for (WebSocketSession webSocketSession : sessions) {
            if (!webSocketSession.isOpen() && webSocketSession.getId().equals(session.getId())) {
                session = webSocketSession;
                break;
            }
        }
        userService.removeSession(session.getId());
        sessions.remove(session);
    }

}

