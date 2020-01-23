package ir.iust.computer.network.darichesignalling.service;

import ir.iust.computer.network.darichesignalling.model.User;
import ir.iust.computer.network.darichesignalling.repository.UserRepository;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class UserService {
    @Resource
    private UserRepository userRepository;

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public void delete(User user) {
        userRepository.delete(user);
    }

    public void removeSession(String sessionId) {
        User user = userRepository.findBySessionId(sessionId).orElseThrow(NullPointerException::new);
        user.setSessionId("");
        userRepository.save(user);
    }


}
