-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-12-2024 a las 10:41:47
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `crud_mvc`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `rol` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `rol`) VALUES
(1, 'Administrador'),
(2, 'Profesor'),
(3, 'Alumno');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones`
--

CREATE TABLE `sesiones` (
  `id_sesion` varchar(40) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sesiones`
--

INSERT INTO `sesiones` (`id_sesion`, `id_usuario`, `fecha_inicio`, `fecha_fin`) VALUES
('177elahk88vvsvk7jk7imnvbsu', 2, '2021-12-28 23:16:41', '2021-12-28 23:17:47'),
('21gudoi594mgupeh2qjq1e4a52', 11, '2021-12-28 23:33:26', '2021-12-28 23:48:37'),
('32snfr109jepcbch10bphu5031', 11, '2021-12-27 13:30:59', '2021-12-27 15:49:55'),
('3ha2phav5mhhp3cvautmv3epa5', 2, '2021-12-27 18:31:01', '2021-12-29 17:36:53'),
('4dsoi56ukarsq50otonv17rja0', 10, '2021-12-26 12:12:00', '2021-12-26 12:12:03'),
('62qlaqm6let9a1d4jtl690gfoo', 10, '2021-12-28 15:46:22', '2021-12-28 15:47:33'),
('64o3rqd1vvil8s500h0t02lhn4', 11, '2021-12-28 23:50:32', '2021-12-28 23:50:38'),
('7ctf1tanlgg2cuht6p3e7jlus8', 11, '2021-12-28 21:01:40', '2021-12-28 23:28:43'),
('7cvl582qmqkn6vclriu0mfu7sl', 10, '2021-12-26 12:12:09', '2021-12-28 20:56:44'),
('805eddac4r8c2e0jscia980pam', 11, '2024-11-13 14:03:06', '2024-11-13 14:26:06'),
('96upjal5t0oe86dodod86ntnof', 10, '2021-12-27 16:31:40', '2021-12-27 17:03:43'),
('9eqgf3s9aroafjhd3heqp9u3b5', 11, '2021-12-25 23:00:57', '2021-12-26 16:29:40'),
('ajel622e5qjvsd5cpuivgn0255', 10, '2021-12-27 16:08:33', '2021-12-27 16:08:53'),
('aom8ikktq7nolje1j600i11har', 11, '2021-12-28 23:51:56', '2021-12-28 23:52:01'),
('aus7ejflu7fdoaj160logf3bgl', 2, '2021-12-28 15:46:08', '2021-12-28 15:46:15'),
('bpv23bjegoni7kdq63v8m9rdv2', 11, '2021-12-27 15:58:47', '2021-12-27 16:08:24'),
('c32rmohceg0s488vuf2d3uc6de', 11, '2021-12-29 15:38:53', '2024-11-05 13:50:56'),
('cc01qnr68emjjeuc92egdtfv5n', 10, '2021-12-29 15:39:21', '2021-12-29 15:41:10'),
('cdl3foj6dfmblg46d9f0e8gfi3', 11, '2024-11-05 13:37:14', '2024-11-05 13:54:08'),
('dophn6fqvnag2av4iqp48kdbl1', 2, '2022-01-10 09:19:21', '2022-01-10 09:20:00'),
('e2no8bqhnvnh45ehgti0kirp2v', 11, '2021-12-27 11:15:26', '2021-12-27 12:50:08'),
('ed16lbgvh22ovt1k7gckfkln5n', 11, '2021-12-25 22:59:30', '2021-12-25 22:59:40'),
('ensbh915jif899q887jhnhg1qu', 11, '2024-12-17 14:29:27', '2024-12-17 14:30:26'),
('fpp19q11vnl5eu8cmuilo0b9po', 10, '2021-12-27 18:12:01', '2021-12-27 18:30:56'),
('goa3mb9lo2ekbv9btmlr20lfoc', 11, '2024-11-13 14:01:15', '2024-11-13 14:02:56'),
('hjub3m2e87irm98do1k88pgslo', 11, '2021-12-28 23:49:50', '2021-12-28 23:50:01'),
('hur3khk5s1s7ven0f9bhprgbhs', 11, '2021-12-27 18:16:53', '2021-12-27 18:55:09'),
('i28nqifqvbkfnl7r7pfcpl8c59', 2, '2022-01-10 09:15:24', '2022-01-10 09:15:36'),
('i5p4s3tmiv5s35sr09ss4snao1', 11, '2021-12-28 15:47:38', '2021-12-28 23:22:29'),
('i7p87fno0jee8qgrkgs6rqmbkq', 11, '2021-12-27 18:09:32', '2021-12-27 18:11:57'),
('jeprspe6nhi9umusbjaroktvo2', 10, '2021-12-27 16:12:29', '2021-12-27 16:31:31'),
('jicp6f9k88cf7ta9pl3u7mc5hs', 11, '2024-11-13 14:26:26', NULL),
('jklgf53v37885r0f4760q5e9mb', 11, '2021-12-27 15:50:09', '2021-12-27 15:58:35'),
('joc73oi3762gkhb5m95dgllnpo', 11, '2021-12-28 11:58:10', '2021-12-28 15:46:03'),
('khk0a4am7lv37ert1om4qq4fjm', 10, '2021-12-27 16:08:59', '2021-12-27 16:12:20'),
('mcvafg495h5vbl4atc5mlveebq', 2, '2021-12-27 17:03:48', '2021-12-27 18:09:26'),
('mt5g81lt2v38t0n2a4s9cptbhu', 10, '2022-01-10 09:16:54', '2022-01-10 09:17:12'),
('mvsor6281bt0guhtusonqovd2l', 11, '2021-12-28 23:29:13', '2021-12-28 23:29:18'),
('n1vm7mebbdpbf7mijh3tgm60hf', 11, '2021-12-27 12:50:15', '2021-12-27 13:30:54'),
('nh8n5d3k9tbsfgr5a56n0ddako', 11, '2021-12-25 22:50:46', '2021-12-25 23:00:00'),
('qesra1soqi5hkg7nm40biijrtq', 11, '2021-12-29 15:35:59', '2021-12-29 15:38:33'),
('qiljg23vgf89cr5mld7ur9a7e1', 11, '2024-12-17 14:29:02', '2024-12-17 14:29:13'),
('qqh5sd4126f1tob5k6tfm1g554', 11, '2021-12-28 23:30:48', '2021-12-28 23:30:54'),
('r8e2osp7lgifucb8rfqd54ovh3', 11, '2021-12-26 16:30:30', '2021-12-27 11:15:13'),
('ser8qrss9t8qdr8i2ufdfj7pve', 11, '2021-12-28 23:53:26', '2021-12-28 23:53:32'),
('ud7hma09qpts8ghjbmfq3kio8i', 2, '2021-12-29 17:37:28', '2021-12-29 17:37:45'),
('vnjt55oq0sfiah207hb3gabp56', 11, '2022-01-10 09:17:17', '2024-11-13 14:02:50'),
('vppl1628q17kmjohnh4slrtsbk', 11, '2021-12-27 18:31:15', '2021-12-28 11:58:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `id_rol` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `telefono`, `id_rol`) VALUES
(2, 'Martaaa Garcíaaaa', 'mgarciaf@cpifpbajoaragon.com', '6534667435', 3),
(10, 'Fede', 'feder@gmail.com', '5555554445', 2),
(11, 'Jonatan', 'jsegurana@cpifpbajoaragon.com', '649556432', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD PRIMARY KEY (`id_sesion`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
