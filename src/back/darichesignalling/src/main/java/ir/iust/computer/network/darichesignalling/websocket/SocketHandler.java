package ir.iust.computer.network.darichesignalling.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.iust.computer.network.darichesignalling.model.SignalType;
import ir.iust.computer.network.darichesignalling.model.SignallingMessage;
import ir.iust.computer.network.darichesignalling.model.User;
import ir.iust.computer.network.darichesignalling.service.UserService;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class SocketHandler extends TextWebSocketHandler {


    private final UserService userService;
    private List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private ObjectMapper objectMapper = new ObjectMapper();


    public SocketHandler(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws InterruptedException, IOException {
        SignallingMessage signallingMessage = objectMapper.readValue(message.getPayload(), SignallingMessage.class);
        if (signallingMessage.getSignalType().equals(SignalType.LOGIN)) {
            User user = userService.getUserByUserName((String) signallingMessage.getData());
            synchronized (this) {
                if (user.getSessionId().isEmpty()) {
                    userService.setSessionId(user.getId(), session.getId());
                } else {
                    SignallingMessage replay = new SignallingMessage();
                    replay.setSignalType(SignalType.ERROR);
                    replay.setData("already login");
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(replay)));
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
        try {
            userService.removeSession(session.getId());
        } catch (NullPointerException e) {
            //
        }
        sessions.remove(session);
    }

}

