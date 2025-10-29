"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Solicitud } from "../types/dashboard";

interface PriceRequestCardProps {
  soli: Solicitud;
  handleAceptRequest: (id: number) => Promise<void>;
  handleRejectRequest: (id: number) => Promise<void>;
  formatearFecha: (fecha: string) => string;
}

export function PriceRequestCard({
  soli,
  handleAceptRequest,
  handleRejectRequest,
  formatearFecha,
}: PriceRequestCardProps) {
  const [openAcept, setOpenAcept] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  return (
    <Card key={soli.id} className="m-4 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Solicitud de Precio</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-cyan-500">
          Estado: <strong>{soli.estado}</strong>
        </p>
        <p className="text-sm mt-1">
          Producto: <strong>{soli.producto?.nombre}</strong> -{" "}
          {soli.producto.descripcion}
        </p>
        <p className="text-sm">
          Solicitado por: <strong>{soli.solicitadoPor?.nombre}</strong>(
          {soli.solicitadoPor.rol}) de{" "}
          <strong>{soli.solicitadoPor.sucursal?.nombre}</strong>
        </p>
        <p className="text-sm">
          Precio solicitado:{" "}
          <strong>
            {new Intl.NumberFormat("es-GT", {
              style: "currency",
              currency: "GTQ",
            }).format(soli.precioSolicitado)}
          </strong>
        </p>
        <p className="text-sm text-gray-500">
          Fecha de solicitud: {formatearFecha(soli.fechaSolicitud)}
        </p>
        {soli.fechaRespuesta && (
          <p className="text-sm text-gray-500">
            Fecha de respuesta: {new Date(soli.fechaRespuesta).toLocaleString()}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <Button onClick={() => setOpenAcept(true)} variant={"default"}>
            Aceptar
          </Button>
          <Dialog open={openAcept} onOpenChange={setOpenAcept}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Aceptar solicitud de precio
                </DialogTitle>
                <DialogDescription className="text-center">
                  Al aceptar la solicitud se creará una instancia de precio que
                  solo se podrá usar una vez para este producto.
                </DialogDescription>
                <DialogDescription className="text-center">
                  ¿Continuar?
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleAceptRequest(soli.id)}
                >
                  Aceptar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setOpenReject(true)} variant={"destructive"}>
            Rechazar
          </Button>
          <Dialog open={openReject} onOpenChange={setOpenReject}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Aceptar solicitud de precio
                </DialogTitle>
                <DialogDescription className="text-center">
                  Se le negará este precio a la sucursal
                </DialogDescription>
                <DialogDescription className="text-center">
                  ¿Continuar?
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant={"destructive"}
                  className="w-full"
                  onClick={() => handleRejectRequest(soli.id)}
                >
                  Si, continuar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
