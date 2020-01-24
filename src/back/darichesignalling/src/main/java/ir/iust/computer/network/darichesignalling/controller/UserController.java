package ir.iust.computer.network.darichesignalling.controller;

import ir.iust.computer.network.darichesignalling.dto.UserDto;
import ir.iust.computer.network.darichesignalling.model.User;
import ir.iust.computer.network.darichesignalling.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin
@RestController
@RequestMapping(produces = "application/json", path = "/users")
public class UserController {

    @Autowired
    private PasswordEncoder passwordEncoder;
    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping(path = "/online")
    public ResponseEntity<List<User>> getOnlineUsers() {
        List<User> onlineUsers = userService.getUsers().stream().filter(user -> !user.getSessionId().isEmpty()).collect(Collectors.toList());
        return new ResponseEntity<>(onlineUsers, HttpStatus.OK);
    }

    @PostMapping(path = "/add")
    public ResponseEntity<User> registerUser(@RequestBody UserDto userDto) {
        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        return new ResponseEntity<>(userService.add(user), HttpStatus.CREATED);
    }
}
