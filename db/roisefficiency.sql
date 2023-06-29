-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-06-2023 a las 03:14:10
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `roisefficiency`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admins`
--

CREATE TABLE `admins` (
  `primer_nombre` varchar(20) NOT NULL,
  `segundo_nombre` varchar(20) NOT NULL,
  `primer_apellido` varchar(20) NOT NULL,
  `segundo_apellido` varchar(20) NOT NULL,
  `rut` varchar(10) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `admins`
--

INSERT INTO `admins` (`primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido`, `rut`, `email`, `password`) VALUES
('admin', 'admin', 'admin', 'admin', 'admin', 'admin@admin.cl', 'admin');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orders`
--

CREATE TABLE `orders` (
  `id` bigint(11) NOT NULL,
  `cost` decimal(8,2) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `product_ids` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `orders`
--

INSERT INTO `orders` (`id`, `cost`, `name`, `email`, `status`, `address`, `phone`, `date`, `product_ids`) VALUES
(41, 75000.00, 'Iván Andrés Cáceres Satorres', 'ivan.caceres_s@mail.udp.cl', 'PAGADO Y ENVIADO', 'AMALIA ARMSTRONG 7541, LA CISTERNA', '+56988388509', '2023-06-27 17:16:31', '3'),
(43, 205000.00, 'Iván Andrés Cáceres Satorres', 'ivan.caceres_s@mail.udp.cl', 'PAGADO Y ENVIADO', 'AMALIA ARMSTRONG 7541, LA CISTERNA', '+56988388509', '2023-06-27 17:41:28', '7,7,8'),
(47, 80000.00, 'Iván Andrés Cáceres Satorres', 'ivan.caceres_s@mail.udp.cl', 'PAGADO Y ENVIADO', 'AMALIA ARMSTRONG 7541, LA CISTERNA', '+56988388509', '2023-06-27 19:29:13', '7');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `sale_price` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `image` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `sale_price`, `quantity`, `image`) VALUES
(1, 'VistaClara', 'Lentes de alta calidad que proporcionan una visión nítida', 50000, NULL, 30, 'Lente_1.PNG'),
(2, 'Brillioptic', 'Lentes con tecnología avanzada para una visión brillante', 65000, NULL, 30, 'Lente_2.PNG'),
(3, 'CrystalView', 'Lentes cristalinos que ofrecen una claridad excepcional', 75000, NULL, 30, 'Lente_3.PNG'),
(4, 'SharpFocus', 'Lentes diseñados para una visión enfocada y precisa', 55000, NULL, 30, 'Lente_4.PNG'),
(5, 'OptiGlow', 'Lentes que realzan los colores y brindan una visión vívida', 60000, NULL, 30, 'Lente_5.PNG'),
(6, 'ClarityMax', 'Lentes de máxima claridad y definición', 70000, NULL, 30, 'Lente_6.PNG'),
(7, 'EliteVision', 'Lentes de calidad premium para una visión excepcional', 80000, NULL, 30, 'Lente_7.PNG'),
(8, 'ClearSight', 'Lentes que ofrecen una visión clara y sin distorsiones', 45000, NULL, 30, 'Lente_8.PNG'),
(9, 'ProGaze', 'Lentes profesionales ideales para trabajos detallados', 90000, NULL, 30, 'Lente_9.PNG'),
(10, 'UltraSharp', 'Lentes ultra nítidos para una visión de alta definición', 55000, NULL, 30, 'Lente_10.PNG'),
(11, 'CrystalGaze', '	Lentes cristalinos que ofrecen una mirada clara y nítida', 60000, 54000, 30, 'Lente_11.PNG'),
(12, 'PrecisionView', 'Lentes diseñados para una visión precisa y detallada', 80000, NULL, 30, 'Lente_12.PNG'),
(13, 'SuperVision', 'Lentes que proporcionan una visión superior y mejorada', 70000, NULL, 30, 'Lente_13.PNG'),
(14, 'ClearOptics', 'Lentes con óptica clara y cristalina', 50000, 45000, 30, 'Lente_14.PNG'),
(15, 'UltraView', 'Lentes de visión ultra amplia y panorámica', 85000, NULL, 30, 'Lente_15.PNG'),
(16, 'BrilliantSight', '	Lentes que ofrecen una visión brillante y vívida', 65000, 59000, 30, 'Lente_16.PNG'),
(17, 'MaxiFocus', 'Lentes para una visión máxima y enfocada', 55000, NULL, 30, 'Lente_17.PNG'),
(18, 'VisionPlus', 'Lentes de alta calidad que ofrecen una visión mejorada', 62000, 56000, 30, 'Lente_18.PNG');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `primer_nombre` varchar(20) NOT NULL,
  `segundo_nombre` varchar(20) NOT NULL,
  `primer_apellido` varchar(20) NOT NULL,
  `segundo_apellido` varchar(20) NOT NULL,
  `rut` varchar(10) NOT NULL,
  `email` varchar(30) NOT NULL,
  `direccion` varchar(50) NOT NULL,
  `receta` varchar(100) NOT NULL,
  `password` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido`, `rut`, `email`, `direccion`, `receta`, `password`) VALUES
('Tobías', 'Matías', 'Guerrero', 'Cheuquepan', '20637552-3', 'tobias.guerrero_c@mail.udp.cl', 'La Giralda 0497, Quilicura', './uploads/20637552-3/receta.png', '2'),
('Iván', 'Andrés', 'Cáceres', 'Satorres', '20707065-3', 'ivan.caceres_s@mail.udp.cl', 'Amalia Armstrong 7541, La Cisterna', './uploads/20707065-3/receta.png', '123');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`rut`,`email`),
  ADD UNIQUE KEY `uc_rut` (`rut`),
  ADD UNIQUE KEY `uc_email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
