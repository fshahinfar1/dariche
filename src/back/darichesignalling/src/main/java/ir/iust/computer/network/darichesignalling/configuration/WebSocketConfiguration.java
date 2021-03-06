package ir.iust.computer.network.darichesignalling.configuration;

import ir.iust.computer.network.darichesignalling.service.UserService;
import ir.iust.computer.network.darichesignalling.websocket.SocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfiguration implements WebSocketConfigurer {

    private final UserService userService;

    @Autowired
    public WebSocketConfiguration(UserService userService){
        this.userService = userService;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new SocketHandler(userService), "/socket")
                .setAllowedOrigins("*");
    }
}
