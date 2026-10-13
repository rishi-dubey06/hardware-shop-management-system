package com.hardwareshop.controller;

import com.hardwareshop.dto.response.ApiResponse;
import com.hardwareshop.dto.response.NotificationLogResponse;
import com.hardwareshop.repository.NotificationLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Notification Logs", description = "Audit trail of sent WhatsApp and SMS notifications")
public class AdminNotificationController {

    private final NotificationLogRepository logRepository;

    public AdminNotificationController(NotificationLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @GetMapping("/logs")
    @Operation(summary = "Get recent notification dispatch logs")
    public ResponseEntity<ApiResponse<List<NotificationLogResponse>>> getRecentLogs() {
        List<NotificationLogResponse> logs = logRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(l -> new NotificationLogResponse(
                        l.getId(),
                        l.getRecipient(),
                        l.getChannel(),
                        l.getNotificationType(),
                        l.getMessage(),
                        l.getStatus(),
                        l.getProviderMessageId(),
                        l.getErrorMessage(),
                        l.getProviderResponse(),
                        l.getSentAt(),
                        l.getCreatedAt()
                ))
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Recent notification logs", logs));
    }
}
