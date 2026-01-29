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
<<<<<<< HEAD:src/Core/EmailService.php
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
=======
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

>>>>>>> main:api_rest/src/Core/EmailService.php
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
<<<<<<< HEAD:src/Core/EmailService.php
            throw new \Exception("No se pudo enviar el correo: " . $e->getMessage());
        }
    }

    /**
     * Enviar email de activación de cuenta
     */
=======
            throw new \Exception("No se pudo enviar el correo");
        }
    }

>>>>>>> main:api_rest/src/Core/EmailService.php
    public function sendActivationEmail(string $to, string $nombre, string $token): void
    {
        $url = "https://midominio.com" . BASE_PATH . "/auth/activar-cuenta?token=$token";

<<<<<<< HEAD:src/Core/EmailService.php
        $subject = "Activa tu cuenta en MiApp";
        $body = "
            <p>Bienvenido $nombre,</p>
            <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
            <p><a href='$url'>$url</a></p>
            <p>Este enlace expirará en 24 horas.</p>
            <p>Si no has solicitado esta cuenta, puedes ignorar este correo.</p>
=======
        $subject = "Activa tu cuenta";
        $body = "
            <p>Hola <strong>$nombre</strong>,</p>
            <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
            <p><a href='$url'>$url</a></p>
            <p>Este enlace expirará en 24 horas.</p>
>>>>>>> main:api_rest/src/Core/EmailService.php
        ";

        $this->sendEmail($to, $subject, $body);
    }

<<<<<<< HEAD:src/Core/EmailService.php
    /**
     * Enviar email para recuperación de contraseña
     */
=======
>>>>>>> main:api_rest/src/Core/EmailService.php
    public function sendPasswordResetEmail(string $to, string $nombre, string $token): void
    {
        $url = "https://midominio.com" . BASE_PATH . "/auth/cambiar-contrasena?token=$token";

<<<<<<< HEAD:src/Core/EmailService.php
        $subject = "Recupera tu contraseña en MiApp";
        $body = "
            <p>Hola $nombre,</p>
            <p>Haz clic en este enlace para cambiar tu contraseña:</p>
=======
        $subject = "Recupera tu contraseña";
        $body = "
            <p>Hola <strong>$nombre</strong>,</p>
            <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
>>>>>>> main:api_rest/src/Core/EmailService.php
            <p><a href='$url'>$url</a></p>
            <p>Este enlace expirará en 1 hora.</p>
        ";

        $this->sendEmail($to, $subject, $body);
    }
<<<<<<< HEAD:src/Core/EmailService.php
}
=======
}
>>>>>>> main:api_rest/src/Core/EmailService.php
