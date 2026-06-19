package com.chatplatform.chat.service;

import com.chatplatform.chat.entity.Contact;
import com.chatplatform.chat.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scans incoming user messages for contact info (email, name) and creates
 * a Contact record the first time one is detected per conversation tenant.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeadCaptureService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}");

    private final ContactRepository contactRepo;

    /**
     * Tries to extract an email from the text and upsert a Contact.
     *
     * @return true if a new contact was created or already existed
     */
    @Transactional
    public boolean tryCapture(UUID tenantId, String text, String senderName) {
        Matcher m = EMAIL_PATTERN.matcher(text);
        if (!m.find()) {
            return false;
        }
        String email = m.group().toLowerCase();

        // Idempotent: skip if we already have this email for this tenant
        if (contactRepo.findByTenantIdAndEmail(tenantId, email).isPresent()) {
            log.debug("Lead already exists: tenant={} email={}", tenantId, email);
            return true;
        }

        Contact c = Contact.builder()
                .tenantId(tenantId)
                .email(email)
                .firstName(senderName)
                .source("chat")
                .stage("new")
                .score(10)
                .build();

        contactRepo.save(c);
        log.info("Lead captured: tenant={} email={}", tenantId, email);
        return true;
    }
}
