package ir.iust.computer.network.darichesignalling.dto;

import lombok.Data;
import org.springframework.stereotype.Component;

import javax.validation.constraints.NotNull;

@Component
@Data
public class UserDto {
    @NotNull
    private String username;
    @NotNull
    private String password;
}
