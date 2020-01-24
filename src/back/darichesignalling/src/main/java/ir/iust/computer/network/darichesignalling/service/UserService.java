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


    public void setSessionId(Long userId, String sessionId) {
        User user = userRepository.findById(userId).orElseThrow(NullPointerException::new);
        user.setSessionId(sessionId);
        userRepository.save(user);
    }

    public User getUserByUserName(String userName) {
        return userRepository.findByUserName(userName).orElseThrow(NullPointerException::new);
    }

    public User add(User user) {
        return userRepository.save(user);
    }
}
