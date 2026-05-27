package com.hms.common.advice;

import com.hms.common.dto.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice(basePackages = "com.hms")
public class GlobalResponseWrapper implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        // Exclude Swagger, raw byte arrays (like PDF receipt), or already wrapped types
        Class<?> paramType = returnType.getParameterType();
        return !paramType.equals(ApiResponse.class) && 
               !paramType.equals(byte[].class) && 
               !paramType.equals(org.springframework.http.ResponseEntity.class);
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {
        
        // Prevent double wrapping
        if (body instanceof ApiResponse) {
            return body;
        }

        // Wrap success response in the standard enterprise envelope
        return ApiResponse.success(body);
    }
}
