"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    animateOnMount?: boolean;
}

export function AnimatedList({
    children,
    className,
    staggerDelay = 0.05,
    animateOnMount = true,
}: AnimatedListProps) {
    return (
        <LayoutGroup>
            <motion.div
                initial={animateOnMount ? { opacity: 0 } : false}
                animate={animateOnMount ? { opacity: 1 } : undefined}
                className={className}
            >
                {children}
            </motion.div>
        </LayoutGroup>
    );
}

interface AnimatedListItemProps {
    children: ReactNode;
    index?: number;
    staggerDelay?: number;
    className?: string;
    onRemove?: () => void;
}

export function AnimatedListItem({
    children,
    index = 0,
    staggerDelay = 0.05,
    className,
    onRemove,
}: AnimatedListItemProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{
                delay: index * staggerDelay,
                type: "spring",
                stiffness: 300,
                damping: 25,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({
    children,
    delay = 0,
    duration = 0.4,
    className,
    direction = "none",
}: FadeInProps) {
    const directions = {
        none: { y: 0, x: 0 },
        up: { y: 20, x: 0 },
        down: { y: -20, x: 0 },
        left: { y: 0, x: 20 },
        right: { y: 0, x: -20 },
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directions[direction],
            }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface StaggerContainerProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    delay?: number;
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.05,
    delay = 0,
}: StaggerContainerProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className={className}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: delay,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

interface StaggerItemProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function StaggerItem({ children, className, delay }: StaggerItemProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.4,
                        delay,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface ScaleInProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    fromScale?: number;
}

export function ScaleIn({
    children,
    className,
    delay = 0,
    fromScale = 0.9,
}: ScaleInProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: fromScale }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
                duration: 0.4,
                delay,
                type: "spring",
                stiffness: 300,
                damping: 25,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface SlideInProps {
    children: ReactNode;
    className?: string;
    direction?: "left" | "right" | "up" | "down";
    delay?: number;
    distance?: number;
}

export function SlideIn({
    children,
    className,
    direction = "up",
    delay = 0,
    distance = 50,
}: SlideInProps) {
    const directions = {
        left: { x: -distance, y: 0 },
        right: { x: distance, y: 0 },
        up: { x: 0, y: distance },
        down: { x: 0, y: -distance },
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{
                duration: 0.5,
                delay,
                type: "spring",
                stiffness: 300,
                damping: 25,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
