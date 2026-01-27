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
        $config = $GLOBALS['config']['email'];

        $this->mailer = new PHPMailer(true);
        $this->mailer->isSMTP();
        $this->mailer->Host       = $config['host'];
        $this->mailer->SMTPAuth   = true;
        $this->mailer->Username   = $config['username'];
        $this->mailer->Password   = $config['password'];
        $this->mailer->SMTPSecure = $config['encryption'];
        $this->mailer->Port       = $config['port'];
        $this->mailer->setFrom($config['from_email'], $config['from_name']);
    }

    /**
     * Método genérico para enviar un email
     */
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

    /**
     * Enviar email de activación de cuenta
     */
    public function sendActivationEmail(string $to, string $nombre, string $token): void
    {
        $url = "https://midominio.com" . BASE_PATH . "/auth/activar-cuenta?token=$token";

        $subject = "Activa tu cuenta en MiApp";
        $body = "
            <p>Bienvenido $nombre,</p>
            <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
            <p><a href='$url'>$url</a></p>
            <p>Este enlace expirará en 24 horas.</p>
            <p>Si no has solicitado esta cuenta, puedes ignorar este correo.</p>
        ";

        $this->sendEmail($to, $subject, $body);
    }

    /**
     * Enviar email para recuperación de contraseña
     */
    public function sendPasswordResetEmail(string $to, string $nombre, string $token): void
    {
        $url = "https://midominio.com" . BASE_PATH . "/auth/cambiar-contrasena?token=$token";

        $subject = "Recupera tu contraseña en MiApp";
        $body = "
            <p>Hola $nombre,</p>
            <p>Haz clic en este enlace para cambiar tu contraseña:</p>
            <p><a href='$url'>$url</a></p>
            <p>Este enlace expirará en 1 hora.</p>
        ";

        $this->sendEmail($to, $subject, $body);
    }
}