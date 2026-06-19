package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.dto.PagedResponse;
import com.chatplatform.core.dto.bot.BotDto;
import com.chatplatform.core.dto.bot.CreateBotRequest;
import com.chatplatform.core.dto.bot.UpdateBotRequest;
import com.chatplatform.core.entity.Bot;
import com.chatplatform.core.entity.User;
import com.chatplatform.core.service.BotService;
import com.chatplatform.core.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bots")
@RequiredArgsConstructor
public class BotController {

    private final BotService botService;
    private final UserService userService;

    /**
     * GET /api/v1/bots?page=0&size=20
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<BotDto>>> listBots(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = TenantContext.getTenantId();
        Page<Bot> botsPage = botService.listBots(tenantId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        Page<BotDto> dtoPage = botsPage.map(BotDto::from);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(dtoPage)));
    }

    /**
     * GET /api/v1/bots/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BotDto>> getBot(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Bot bot = botService.getBotOrThrow(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok(BotDto.from(bot)));
    }

    /**
     * POST /api/v1/bots
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('tenant:owner', 'tenant:admin', 'tenant:member')")
    public ResponseEntity<ApiResponse<BotDto>> createBot(
            @Valid @RequestBody CreateBotRequest req,
            @AuthenticationPrincipal JwtAuthenticationToken jwt) {

        UUID tenantId = TenantContext.getTenantId();
        User user = userService.getCurrentUser(jwt);
        Bot bot = botService.createBot(req, tenantId, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(BotDto.from(bot)));
    }

    /**
     * PUT /api/v1/bots/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BotDto>> updateBot(
            @PathVariable UUID id,
            @RequestBody UpdateBotRequest req) {

        UUID tenantId = TenantContext.getTenantId();
        Bot bot = botService.updateBot(id, tenantId, req);
        return ResponseEntity.ok(ApiResponse.ok(BotDto.from(bot)));
    }

    /**
     * POST /api/v1/bots/{id}/publish
     * Moves bot from draft → active.
     */
    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<BotDto>> publishBot(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Bot bot = botService.publishBot(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok(BotDto.from(bot)));
    }

    /**
     * DELETE /api/v1/bots/{id}
     * Soft-deletes (archives) the bot.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('tenant:owner', 'tenant:admin')")
    public ResponseEntity<ApiResponse<Void>> deleteBot(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        botService.deleteBot(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * GET /api/v1/bots/{id}/embed-code
     * Returns the HTML snippet customers paste into their website.
     */
    @GetMapping("/{id}/embed-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> getEmbedCode(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Bot bot = botService.getBotOrThrow(id, tenantId);

        String snippet = """
            <script src="https://cdn.yourdomain.com/widget.js"
                    data-embed-token="%s"
                    async>
            </script>
            """.formatted(bot.getEmbedToken());

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "embed_token", bot.getEmbedToken(),
                "snippet",     snippet
        )));
    }
}
