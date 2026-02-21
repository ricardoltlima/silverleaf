package com.hoa.silverleaf.feed;

import com.hoa.silverleaf.feed.dto.UploadMediaResponse;
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

@Service
public class FeedUploadService {

    private final Path uploadPath;

    public FeedUploadService(@Value("${app.feed.upload-dir:uploads}") String uploadDir) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public UploadMediaResponse upload(MultipartFile file, boolean asAttachment) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        FeedMediaType mediaType = asAttachment
                ? FeedMediaType.FILE
                : resolveMediaType(file.getContentType(), file.getOriginalFilename());
        String extension = resolveExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            Files.createDirectories(uploadPath);
            Path target = uploadPath.resolve(fileName).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to store file");
        }

        return new UploadMediaResponse(mediaType, "/uploads/" + fileName);
    }

    private FeedMediaType resolveMediaType(String contentType, String originalName) {
        String ct = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        String name = originalName == null ? "" : originalName.toLowerCase(Locale.ROOT);

        if (ct.startsWith("image/") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")
                || name.endsWith(".gif") || name.endsWith(".webp")) {
            return FeedMediaType.IMAGE;
        }
        if (ct.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".ogg")
                || name.endsWith(".mov")) {
            return FeedMediaType.VIDEO;
        }
        throw new IllegalArgumentException("Unsupported file type");
    }

    private String resolveExtension(String originalName) {
        if (originalName == null || !originalName.contains(".")) {
            return "";
        }
        String ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase(Locale.ROOT);
        return ext.matches("\\.[a-z0-9]{1,8}") ? ext : "";
    }
}
