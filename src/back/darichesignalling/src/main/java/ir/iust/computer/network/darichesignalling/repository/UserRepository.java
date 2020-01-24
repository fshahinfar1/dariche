package ir.iust.computer.network.darichesignalling.repository;

import ir.iust.computer.network.darichesignalling.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySessionId(String sessionId);
    Optional<User> findByUserName(String userName);
}
