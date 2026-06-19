package com.chatplatform.core.exception;

import org.springframework.http.HttpStatus;

/**
 * For business rule violations (e.g. quota exceeded, duplicate bot name).
 * Carries an HTTP status so GlobalExceptionHandler can return the right code.
 */
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus status;

    public BusinessException(String errorCode, String message) {
        this(errorCode, message, HttpStatus.BAD_REQUEST);
    }

    public BusinessException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    public String getErrorCode() { return errorCode; }
    public HttpStatus getStatus() { return status; }
}
