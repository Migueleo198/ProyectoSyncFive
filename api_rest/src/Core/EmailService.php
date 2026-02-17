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

        $this->mailer->setFrom(MAIL_FROM_EMAIL, MAIL_FROM_NAME);
    }

    // ================================================================
    // MÉTODO BASE — Estructura HTML compartida por todos los correos
    // ================================================================
    private function buildEmailTemplate(
        string $titulo,
        string $contenido,
        string $urlBoton,
        string $textoBoton,
        string $colorBoton = '#dc3545',  // Rojo SIGEBO por defecto
        string $expiracion = ''
    ): string {
        $footerExpiracion = $expiracion
            ? "<p style='margin:0 0 8px;'>⏱️ {$expiracion}</p>"
            : '';

        return "
        <!DOCTYPE html>
        <html lang='es'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>{$titulo}</title>
        </head>
        <body style='margin:0; padding:0; background-color:#f8f9fa; font-family: Arial, Helvetica, sans-serif;'>

            <!-- WRAPPER -->
            <table width='100%' cellpadding='0' cellspacing='0' border='0'
                   style='background-color:#f8f9fa; padding: 40px 20px;'>
                <tr>
                    <td align='center'>

                        <!-- CARD PRINCIPAL -->
                        <table width='600' cellpadding='0' cellspacing='0' border='0'
                               style='max-width:600px; width:100%; background:#ffffff;
                                      border-radius:8px; overflow:hidden;
                                      box-shadow: 0 2px 8px rgba(0,0,0,0.08);'>

                            <!-- HEADER -->
                            <tr>
                                <td style='background-color:{$colorBoton}; padding: 28px 40px; text-align:center;'>
                                    <h1 style='margin:0; color:#ffffff; font-size:22px;
                                               font-weight:700; letter-spacing:1px;'>
                                        🚨 SIGEBO 🚨
                                    </h1>
                                    <p style='margin:6px 0 0; color:rgba(255,255,255,0.85);
                                              font-size:13px; letter-spacing:0.5px;'>
                                        Sistema de Gestión de Bomberos
                                    </p>
                                </td>
                            </tr>

                            <!-- CONTENIDO -->
                            <tr>
                                <td style='padding: 40px 40px 32px;'>

                                    <!-- TÍTULO -->
                                    <h2 style='margin:0 0 20px; color:#212529;
                                               font-size:20px; font-weight:600;
                                               border-bottom: 2px solid #f0f0f0;
                                               padding-bottom: 16px;'>
                                        {$titulo}
                                    </h2>

                                    <!-- CUERPO -->
                                    <div style='color:#495057; font-size:15px; line-height:1.7;'>
                                        {$contenido}
                                    </div>

                                    <!-- BOTÓN CTA -->
                                    <div style='text-align:center; margin: 32px 0 24px;'>
                                        <a href='{$urlBoton}'
                                           style='display:inline-block; background-color:{$colorBoton};
                                                  color:#ffffff; text-decoration:none;
                                                  padding: 14px 36px; border-radius:6px;
                                                  font-size:15px; font-weight:600;
                                                  letter-spacing:0.3px;'>
                                            {$textoBoton}
                                        </a>
                                    </div>

                                    <!-- ENLACE ALTERNATIVO -->
                                    <p style='color:#6c757d; font-size:12px; text-align:center; margin:0;'>
                                        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                        <a href='{$urlBoton}'
                                           style='color:{$colorBoton}; word-break:break-all;'>
                                            {$urlBoton}
                                        </a>
                                    </p>

                                </td>
                            </tr>

                            <!-- SEPARADOR -->
                            <tr>
                                <td style='padding: 0 40px;'>
                                    <hr style='border:none; border-top:1px solid #e9ecef; margin:0;'>
                                </td>
                            </tr>

                            <!-- FOOTER -->
                            <tr>
                                <td style='padding: 20px 40px 28px; text-align:center;
                                           color:#adb5bd; font-size:12px; line-height:1.6;'>
                                    {$footerExpiracion}
                                    <p style='margin:0 0 8px;'>
                                        Si no has solicitado esta acción, puedes ignorar este correo.
                                    </p>
                                    <p style='margin:0;'>
                                        © " . date('Y') . " SIGEBO · Teruel. SPEIS
                                    </p>
                                </td>
                            </tr>

                        </table>
                        <!-- FIN CARD -->

                    </td>
                </tr>
            </table>

        </body>
        </html>
        ";
    }

    // ================================================================
    // ENVÍO GENÉRICO
    // ================================================================
    public function sendEmail(string $to, string $subject, string $body): void
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($to);
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body    = $body;
            // Versión texto plano para clientes que no soportan HTML
            $this->mailer->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<p>'], "\n", $body));
            $this->mailer->send();
        } catch (Exception $e) {
            throw new \Exception("No se pudo enviar el correo: " . $e->getMessage());
        }
    }

    // ================================================================
    // ACTIVACIÓN DE CUENTA
    // ================================================================
    public function sendActivationEmail(string $to, string $nombre, string $token): void
    {
        $url = "http://192.168.13.108:8085/frontend/pages/Login/activarCuenta.html?token={$token}";

        $contenido = "
            <p>Hola <strong style='color:#212529;'>{$nombre}</strong>,</p>
            <p>Tu cuenta en <strong>SIGEBO</strong> ha sido creada correctamente.</p>
            <p>Para completar el registro y poder acceder al sistema, activa tu cuenta
               haciendo clic en el botón:</p>
        ";

        $body = $this->buildEmailTemplate(
            titulo:      'Activa tu cuenta',
            contenido:   $contenido,
            urlBoton:    $url,
            textoBoton:  '✓ Activar mi cuenta',
            colorBoton:  '#dc3545',
            expiracion:  'Este enlace expirará en 24 horas.'
        );

        $this->sendEmail($to, '🚨 SIGEBO — Activa tu cuenta', $body);
    }

    // ================================================================
    // RECUPERACIÓN DE CONTRASEÑA
    // ================================================================
    public function sendPasswordResetEmail(string $to, string $nombre, string $token): void
    {
        $url = "http://192.168.13.108:8085/frontend/pages/Login/cambiarPassword.html?token={$token}";

        $contenido = "
            <p>Hola <strong style='color:#212529;'>{$nombre}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña
               de tu cuenta en <strong>SIGEBO</strong>.</p>
            <p>Si fuiste tú, haz clic en el botón para crear una nueva contraseña:</p>
        ";

        $body = $this->buildEmailTemplate(
            titulo:      'Restablecer contraseña',
            contenido:   $contenido,
            urlBoton:    $url,
            textoBoton:  '🔑 Cambiar mi contraseña',
            colorBoton:  '#0d6efd',   // Azul Bootstrap para diferenciarlo visualmente
            expiracion:  'Este enlace expirará en 1 hora.'
        );

        $this->sendEmail($to, '🚨 SIGEBO — Recupera tu contraseña', $body);
    }
}