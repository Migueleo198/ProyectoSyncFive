<?php
declare(strict_types=1);

namespace Core;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private PHPMailer $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);

        $this->mailer->isSMTP();
        $this->mailer->Host       = MAIL_HOST;
        $this->mailer->SMTPAuth   = true;
        $this->mailer->Username   = MAIL_USERNAME;
        $this->mailer->Password   = MAIL_PASSWORD;
        $this->mailer->SMTPSecure = MAIL_ENCRYPTION;
        $this->mailer->Port       = MAIL_PORT;
        $this->mailer->CharSet    = 'UTF-8';

        $this->mailer->setFrom(
            MAIL_FROM_EMAIL,
            MAIL_FROM_NAME
        );
    }

    public function sendEmail(string $to, string $subject, string $body): void
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($to);
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body    = $body;
            $this->mailer->send();
        } catch (Exception $e) {
            throw new \Exception("No se pudo enviar el correo: " . $e->getMessage());
        }
    }

    public function sendActivationEmail(string $to, string $nombre, string $token): void
    {
        $url = "https://midominio.com" . BASE_PATH . "/auth/activar-cuenta?token=$token";

        $subject = "Activa tu cuenta";
        $body = "
            <p>Hola <strong>$nombre</strong>,</p>
            <p>Para activar tu cuenta haz clic en el siguiente enlace:</p>
            <p><a href='$url'>$url</a></p>
            <p>Este enlace expirará en 24 horas.</p>
        ";

        $this->sendEmail($to, $subject, $body);
    }

    public function sendPasswordResetEmail(string $to, string $nombre, string $token): void
    {
        $url = "https://midominio.com" . BASE_PATH . "/auth/cambiar-contrasena?token=$token";

        $subject = "Recupera tu contraseña";
        $body = "
            <p>Hola <strong>$nombre</strong>,</p>
            <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
            <p><a href='$url'>$url</a></p>
            <p>Este enlace expirará en 1 hora.</p>
        ";

        $this->sendEmail($to, $subject, $body);
    }
}
