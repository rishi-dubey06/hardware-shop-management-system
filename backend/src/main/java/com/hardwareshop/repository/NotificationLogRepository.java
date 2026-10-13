package com.hardwareshop.repository;

import com.hardwareshop.entity.NotificationChannel;
import com.hardwareshop.entity.NotificationLog;
import com.hardwareshop.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findTop20ByOrderByCreatedAtDesc();
    Page<NotificationLog> findByChannel(NotificationChannel channel, Pageable pageable);
    Page<NotificationLog> findByNotificationType(NotificationType notificationType, Pageable pageable);
}
