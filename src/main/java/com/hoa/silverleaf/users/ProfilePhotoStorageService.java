package com.hoa.silverleaf.users;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class ProfilePhotoStorageService {

    private final Path uploadPath;

    public ProfilePhotoStorageService(@Value("${app.feed.upload-dir:uploads}") String uploadDir) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String saveProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Photo file is required");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!contentType.startsWith("image/")
                && !(originalName.endsWith(".png") || originalName.endsWith(".jpg") || originalName.endsWith(".jpeg") || originalName.endsWith(".webp"))) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        String extension = resolveExtension(originalName);
        String fileName = "profile-" + UUID.randomUUID().toString().replace("-", "") + extension;
        try {
            Files.createDirectories(uploadPath);
            Path target = uploadPath.resolve(fileName).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored resident profile photo path={}", target);
            return "/uploads/" + fileName;
        } catch (IOException ex) {
            log.error("Failed to store resident profile photo", ex);
            throw new IllegalStateException("Unable to store profile photo");
        }
    }

    public void deleteIfLocal(String url) {
        if (url == null || !url.startsWith("/uploads/")) {
            return;
        }
        String fileName = url.substring("/uploads/".length()).trim();
        if (fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return;
        }
        Path target = uploadPath.resolve(fileName).normalize();
        try {
            Files.deleteIfExists(target);
        } catch (IOException ex) {
            log.warn("Failed to delete old resident profile photo path={}", target, ex);
        }
    }

    private String resolveExtension(String originalName) {
        if (originalName == null || !originalName.contains(".")) {
            return ".jpg";
        }
        String ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase(Locale.ROOT);
        return ext.matches("\\.[a-z0-9]{1,8}") ? ext : ".jpg";
    }
}
